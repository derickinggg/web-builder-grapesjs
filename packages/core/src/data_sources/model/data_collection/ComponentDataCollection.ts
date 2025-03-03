import { isArray } from 'underscore';
import { ObjectAny } from '../../../common';
import Component from '../../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions } from '../../../dom_components/model/types';
import EditorModel from '../../../editor/model/Editor';
import { isObject, serialize, toLowerCase } from '../../../utils/mixins';
import DataResolverListener from '../DataResolverListener';
import DataSource from '../DataSource';
import DataVariable, { DataVariableProps, DataVariableType } from '../DataVariable';
import { isDataVariable } from '../utils';
import { DataCollectionType, keyCollectionDefinition, keyCollectionsStateMap, keyIsCollectionItem } from './constants';
import {
  ComponentDataCollectionProps,
  DataCollectionConfig,
  DataCollectionDataSource,
  DataCollectionProps,
  DataCollectionState,
  DataCollectionStateMap,
} from './types';
import { getSymbolsToUpdate } from '../../../dom_components/model/SymbolUtils';
import { StyleProps, UpdateStyleOptions } from '../../../domain_abstract/model/StyleableModel';

export default class ComponentDataCollection extends Component {
  constructor(props: ComponentDataCollectionProps, opt: ComponentOptions) {
    const collectionDef = props[keyCollectionDefinition];
    // If we are cloning, leave setting the collection items to the main symbol collection
    if (opt.forCloning) {
      return super(props as any, opt) as unknown as ComponentDataCollection;
    }

    const em = opt.em;
    const newProps = { ...props, components: undefined, droppable: false } as any;
    const cmp: ComponentDataCollection = super(newProps, opt) as unknown as ComponentDataCollection;

    if (!collectionDef) {
      em.logError('missing collection definition');
      return cmp;
    }

    return cmp;
  }

  getItemsCount(): number {
    const items = this.getDataSourceItems();
    const startIndex = Math.max(0, this.collectionConfig.startIndex || 0);
    const configEndIndex = this.getConfigStartIndex() || Number.MAX_VALUE;
    const endIndex = Math.min(items.length - 1, configEndIndex);

    return endIndex - startIndex + 1;
  }

  getConfigStartIndex() {
    return this.collectionConfig.startIndex;
  }

  getConfigEndIndex() {
    return this.collectionConfig.endIndex;
  }

  getComponentDef(): ComponentDefinition {
    const componentDef = this.getFirstChildJSON();
    return componentDef;
  }

  getDataSource(): DataCollectionDataSource {
    const collectionDef = this.collectionDef;

    return collectionDef?.collectionConfig?.dataSource;
  }

  getCollectionId(): string {
    const collectionDef = this.collectionDef;

    return collectionDef?.collectionConfig?.collectionId;
  }

  setComponentDef(componentDef: ComponentDefinition) {
    const collectionDef = { ...this.collectionDef };
    collectionDef.componentDef = componentDef;

    this.set(keyCollectionDefinition, collectionDef);
  }

  setStartIndex(startIndex: number) {
    if (startIndex < 0) {
      this.em.logError('Start index should be greater than or equal to 0');
      return;
    }

    const newCollectionConfig = { ...this.collectionConfig };
    newCollectionConfig.startIndex = startIndex;

    const collectionDef = { ...this.collectionDef, collectionConfig: newCollectionConfig };
    this.set(keyCollectionDefinition, collectionDef);
  }

  setEndIndex(endIndex: number) {
    const collectionConfig = { ...this.collectionConfig };
    collectionConfig.endIndex = endIndex;

    const collectionDef = { ...this.collectionDef, collectionConfig };
    this.set(keyCollectionDefinition, collectionDef);
  }

  setDataSource(dataSource: DataCollectionDataSource) {
    const collectionConfig = { ...this.collectionConfig };
    collectionConfig.dataSource = dataSource;

    const collectionDef = { ...this.collectionDef, collectionConfig };
    this.set(keyCollectionDefinition, collectionDef);
  }

  private getDataSourceItems() {
    const collectionDef = this.collectionDef;
    const collectionConfig = collectionDef?.collectionConfig;

    if (!collectionConfig) {
      return [];
    }

    const items = getDataSourceItems(collectionConfig.dataSource, this.em);
    return items;
  }

  private getCollectionStateMap() {
    return (this.get(keyCollectionsStateMap) || {}) as DataCollectionStateMap;
  }

  private get collectionDef() {
    return (this.get(keyCollectionDefinition) || {}) as DataCollectionProps;
  }

  private get collectionConfig() {
    return (this.collectionDef?.collectionConfig || {}) as DataCollectionConfig;
  }

  private get collectionDataSource() {
    return this.collectionConfig.dataSource;
  }

  private getFirstChildJSON() {
    const firstChild = this.components().at(0);
    const firstChildJSON = firstChild ? serialize(firstChild) : this.collectionDef.componentDef;
    delete firstChildJSON?.draggable;
    delete firstChildJSON?.removable;

    return firstChildJSON;
  }

  getCollectionItems() {
    const { componentDef, collectionConfig } = this.collectionDef;
    const result = validateCollectionConfig(collectionConfig, componentDef, this.em);
    if (!result) {
      return [];
    }

    const components: Component[] = [];
    const collectionId = collectionConfig.collectionId;
    const items = this.getDataSourceItems();

    const startIndex = this.getConfigStartIndex() ?? 0;
    const configEndIndex = this.getConfigEndIndex() ?? Number.MAX_VALUE;
    const endIndex = Math.min(items.length - 1, configEndIndex);
    const totalItems = endIndex - startIndex + 1;
    const parentCollectionStateMap = this.getCollectionStateMap();

    let symbolMain: Component;
    for (let index = startIndex; index <= endIndex; index++) {
      const item = items[index];
      const isFirstItem = index === startIndex;
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
        this.em.logError(
          `The collection ID "${collectionId}" already exists in the parent collection state. Overriding it is not allowed.`,
        );

        return [];
      }

      const collectionsStateMap: DataCollectionStateMap = {
        ...parentCollectionStateMap,
        [collectionId]: collectionState,
      };

      if (isFirstItem) {
        const componentType = (componentDef?.type as string) || 'default';
        let type = this.em.Components.getType(componentType) || this.em.Components.getType('default');
        const Model = type.model;
        symbolMain = new Model(
          {
            ...serialize(componentDef),
            draggable: false,
            removable: false,
          },
          this.opt,
        );
      }

      const instance = symbolMain!.clone({ symbol: true });
      !isFirstItem && instance.set('locked', true);
      setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(instance);

      components.push(instance);
    }

    return components;
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataCollectionType;
  }

  toJSON(opts?: ObjectAny) {
    const json = super.toJSON.call(this, opts) as ComponentDataCollectionProps;
    json[keyCollectionDefinition].componentDef = this.getFirstChildJSON();
    delete json.components;
    delete json.droppable;

    return json;
  }
}

function setCollectionStateMapAndPropagate(collectionsStateMap: DataCollectionStateMap, collectionId: string) {
  return (cmp: Component) => {
    setCollectionStateMap(collectionsStateMap)(cmp);

    const addListener = (component: Component) => {
      setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(component);
    };

    const listenerKey = `_hasAddListener${collectionId ? `_${collectionId}` : ''}`;
    const cmps = cmp.components();

    // Add the 'add' listener if not already in the listeners array
    if (!cmp.collectionStateListeners.includes(listenerKey)) {
      cmp.listenTo(cmps, 'add', addListener);
      cmp.collectionStateListeners.push(listenerKey);

      const removeListener = (component: Component) => {
        component.stopListening(component.components(), 'add', addListener);
        component.off(`change:${keyCollectionsStateMap}`, handleCollectionStateMapChange);
        const index = component.collectionStateListeners.indexOf(listenerKey);
        if (index !== -1) {
          component.collectionStateListeners.splice(index, 1);
        }

        const collectionsStateMap = component.get(keyCollectionsStateMap);
        component.set(keyCollectionsStateMap, {
          ...collectionsStateMap,
          [collectionId]: undefined,
        });
      };

      cmp.listenTo(cmps, 'remove', removeListener);
    }

    cmps?.toArray().forEach((component: Component) => {
      setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(component);
    });

    cmp.on(`change:${keyCollectionsStateMap}`, handleCollectionStateMapChange);
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

  const startIndex = collectionConfig?.startIndex;

  if (startIndex !== undefined && (startIndex < 0 || !Number.isInteger(startIndex))) {
    em.logError(`Invalid startIndex: ${startIndex}. It must be a non-negative integer.`);
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
    cmp.dataResolverWatchers.updateCollectionStateMap(updatedCollectionStateMap);

    const parentCollectionsId = Object.keys(updatedCollectionStateMap);
    const isFirstItem = parentCollectionsId.every(
      (key) => updatedCollectionStateMap[key].currentIndex === updatedCollectionStateMap[key].startIndex,
    );

    if (isFirstItem) {
      cmp.__onStyleChange = (newStyles: StyleProps, opts: UpdateStyleOptions = {}) => {
        const cmps = getSymbolsToUpdate(cmp);

        cmps.forEach((cmp) => {
          cmp.addStyle(newStyles, opts);
        });
      };
    }
  };
}

function getDataSourceItems(dataSource: DataCollectionDataSource, em: EditorModel) {
  let items: DataVariableProps[] = [];

  switch (true) {
    case isArray(dataSource):
      items = dataSource;
      break;
    case isObject(dataSource) && dataSource instanceof DataSource: {
      const id = dataSource.get('id')!;
      items = listDataSourceVariables(id, em);
      break;
    }
    case isDataVariable(dataSource): {
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

function listDataSourceVariables(dataSource_id: string, em: EditorModel): DataVariableProps[] {
  const records = em.DataSources.getValue(dataSource_id, []);
  const keys = Object.keys(records);

  return keys.map((key) => ({
    type: DataVariableType,
    path: dataSource_id + '.' + key,
  }));
}
