import DataVariable, { DataVariableType } from '../DataVariable';
import { isArray } from 'underscore';
import Component from '../../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions } from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import DataSource from '../DataSource';
import { ObjectAny } from '../../../common';
import EditorModel from '../../../editor/model/Editor';
import {
  ComponentDataCollectionDefinition,
  DataCollectionConfig,
  DataCollectionDefinition,
  DataCollectionState,
  DataCollectionStateMap,
} from './types';
import {
  keyCollectionDefinition,
  keyCollectionsStateMap,
  CollectionComponentType,
  keyIsCollectionItem,
} from './constants';
import DynamicVariableListenerManager from '../DataVariableListenerManager';

export default class ComponentDataCollection extends Component {
  constructor(props: ComponentDataCollectionDefinition, opt: ComponentOptions) {
    const collectionDef = props[keyCollectionDefinition];
    if (opt.forCloning) {
      // If we are cloning, leave setting the collection items to the main symbol collection
      return super(props as any, opt) as unknown as ComponentDataCollection;
    }

    const em = opt.em;
    const cmp: ComponentDataCollection = super(
      {
        ...props,
        components: undefined,
        droppable: false,
      } as any,
      opt,
    ) as unknown as ComponentDataCollection;

    if (!collectionDef) {
      em.logError('missing collection definition');

      return cmp;
    }

    const parentCollectionStateMap = (props[keyCollectionsStateMap] || {}) as DataCollectionStateMap;

    const components: Component[] = getCollectionItems(em, collectionDef, parentCollectionStateMap, opt);
    cmp.components(components);

    if (this.hasDynamicDataSource()) {
      this.watchDataSource(em, parentCollectionStateMap, opt);
    }

    return cmp;
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === CollectionComponentType;
  }

  hasDynamicDataSource() {
    const dataSource = this.get(keyCollectionDefinition).collectionConfig.dataSource;
    return typeof dataSource === 'object' && dataSource.type === DataVariableType;
  }

  toJSON(opts?: ObjectAny) {
    const json = super.toJSON.call(this, opts) as ComponentDataCollectionDefinition;

    const firstChild = this.getComponentDef();
    json[keyCollectionDefinition].componentDef = firstChild;

    delete json.components;
    delete json.droppable;
    return json;
  }

  private getComponentDef() {
    const firstChildJSON = JSON.parse(JSON.stringify(this.components().at(0)));
    delete firstChildJSON.draggable;

    return firstChildJSON;
  }

  private watchDataSource(em: EditorModel, parentCollectionStateMap: DataCollectionStateMap, opt: ComponentOptions) {
    const path = this.get(keyCollectionDefinition).collectionConfig.dataSource?.path;
    const dataVariable = new DataVariable(
      {
        type: DataVariableType,
        path,
      },
      { em },
    );

    new DynamicVariableListenerManager({
      em: em,
      dataVariable,
      updateValueFromDataVariable: () => {
        const collectionItems = getCollectionItems(
          em,
          this.get(keyCollectionDefinition),
          parentCollectionStateMap,
          opt,
        );
        this.components().reset(collectionItems);
      },
    });
  }
}

function getCollectionItems(
  em: EditorModel,
  collectionDef: DataCollectionDefinition,
  parentCollectionStateMap: DataCollectionStateMap,
  opt: ComponentOptions,
) {
  const { componentDef, collectionConfig } = collectionDef;
  const result = validateCollectionConfig(collectionConfig, componentDef, em);
  if (!result) {
    return [];
  }

  const collectionId = collectionConfig.collectionId;

  const components: Component[] = [];

  let items: any[] = getDataSourceItems(collectionConfig.dataSource, em);
  const startIndex = Math.max(0, collectionConfig.startIndex || 0);
  const endIndex = Math.min(
    items.length - 1,
    collectionConfig.endIndex !== undefined ? collectionConfig.endIndex : Number.MAX_VALUE,
  );

  const totalItems = endIndex - startIndex + 1;
  let blockSymbolMain: Component;
  for (let index = startIndex; index <= endIndex; index++) {
    const item = items[index];
    const collectionState: DataCollectionState = {
      collectionId,
      currentIndex: index,
      currentItem: item,
      startIndex: startIndex,
      endIndex: endIndex,
      totalItems: totalItems,
      remainingItems: totalItems - (index + 1),
    };

    if (parentCollectionStateMap[collectionId]) {
      em.logError(
        `The collection ID "${collectionId}" already exists in the parent collection state. Overriding it is not allowed.`,
      );
      return [];
    }

    const collectionsStateMap: DataCollectionStateMap = {
      ...parentCollectionStateMap,
      [collectionId]: collectionState,
    };

    if (index === startIndex) {
      const componentType = (componentDef?.type as string) || 'default';
      let type = em.Components.getType(componentType);
      // Handle the case where the type is not found
      if (!type) {
        em.logWarning(`Component type "${componentType}" not found. Using default type.`);
        const defaultType = em.Components.getType('default');
        if (!defaultType) {
          throw new Error('Default component type not found. Cannot proceed.');
        }
        type = defaultType;
      }
      const model = type.model;

      blockSymbolMain = new model(
        {
          ...componentDef,
          draggable: false,
        },
        opt,
      );
      setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(blockSymbolMain);
    }
    const instance = blockSymbolMain!.clone({ symbol: true });
    setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(instance);

    components.push(instance);
  }

  return components;
}

function setCollectionStateMapAndPropagate(
  collectionsStateMap: DataCollectionStateMap,
  collectionId: string | undefined,
) {
  return (model: Component) => {
    // Set the collectionStateMap on the current model
    setCollectionStateMap(collectionsStateMap)(model);

    // Listener function for the 'add' event
    const addListener = (component: Component) => {
      setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(component);
    };

    // Generate a unique listener key
    const listenerKey = `_hasAddListener${collectionId ? `_${collectionId}` : ''}`;

    // Add the 'add' listener if not already in the listeners array
    if (!model.collectionStateListeners.includes(listenerKey)) {
      model.listenTo(model.components(), 'add', addListener);
      model.collectionStateListeners.push(listenerKey);

      // Add a 'remove' listener to clean up
      const removeListener = (component: Component) => {
        component.stopListening(component.components(), 'add', addListener); // Remove the 'add' listener
        component.off(`change:${keyCollectionsStateMap}`, handleCollectionStateMapChange); // Remove the change listener
        const index = component.collectionStateListeners.indexOf(listenerKey);
        if (index > -1) {
          component.collectionStateListeners.splice(index, 1); // Remove the listener key
        }
      };

      model.listenTo(model.components(), 'remove', removeListener);
    }

    // Recursively apply to all child components
    model
      .components()
      ?.toArray()
      .forEach((component: Component) => {
        setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(component);
      });

    // Listen for changes in the collectionStateMap and propagate to children
    model.on(`change:${keyCollectionsStateMap}`, handleCollectionStateMapChange);
  };
}

function handleCollectionStateMapChange(this: Component) {
  const updatedCollectionsStateMap = this.get(keyCollectionsStateMap);
  this.components()
    ?.toArray()
    .forEach((component: Component) => {
      setCollectionStateMap(updatedCollectionsStateMap)(component);
    });
}

function logErrorIfMissing(property: any, propertyPath: string, em: EditorModel) {
  if (!property) {
    em.logError(`The "${propertyPath}" property is required in the collection definition.`);
    return false;
  }
  return true;
}

function validateCollectionConfig(
  collectionConfig: DataCollectionConfig,
  componentDef: ComponentDefinition,
  em: EditorModel,
) {
  const validations = [
    { property: collectionConfig, propertyPath: 'collectionConfig' },
    { property: componentDef, propertyPath: 'componentDef' },
    { property: collectionConfig?.collectionId, propertyPath: 'collectionConfig.collectionId' },
    { property: collectionConfig?.dataSource, propertyPath: 'collectionConfig.dataSource' },
  ];

  for (const { property, propertyPath } of validations) {
    if (!logErrorIfMissing(property, propertyPath, em)) {
      return [];
    }
  }

  return true;
}

function setCollectionStateMap(collectionsStateMap: DataCollectionStateMap) {
  return (cmp: Component) => {
    cmp.set(keyIsCollectionItem, true);
    const updatedCollectionStateMap = {
      ...cmp.get(keyCollectionsStateMap),
      ...collectionsStateMap,
    };
    cmp.set(keyCollectionsStateMap, updatedCollectionStateMap);
    cmp.componentDVListener.updateCollectionStateMap(updatedCollectionStateMap);
  };
}

function getDataSourceItems(dataSource: any, em: EditorModel) {
  let items: any[] = [];
  switch (true) {
    case isArray(dataSource):
      items = dataSource;
      break;
    case typeof dataSource === 'object' && dataSource instanceof DataSource: {
      const id = dataSource.get('id')!;
      items = listDataSourceVariables(id, em);
      break;
    }
    case typeof dataSource === 'object' && dataSource.type === DataVariableType: {
      const isDataSourceId = dataSource.path.split('.').length === 1;
      if (isDataSourceId) {
        const id = dataSource.path;
        items = listDataSourceVariables(id, em);
      } else {
        // Path points to a record in the data source
        items = em.DataSources.getValue(dataSource.path, []);
      }
      break;
    }
    default:
  }
  return items;
}

function listDataSourceVariables(dataSource_id: string, em: EditorModel) {
  const records = em.DataSources.getValue(dataSource_id, []);
  const keys = Object.keys(records);

  return keys.map((key) => ({
    type: DataVariableType,
    path: dataSource_id + '.' + key,
  }));
}
