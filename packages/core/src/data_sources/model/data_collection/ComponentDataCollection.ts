import { bindAll, isArray } from 'underscore';
import { ObjectAny } from '../../../common';
import Component from '../../../dom_components/model/Component';
import {
  ComponentAddType,
  ComponentDefinition,
  ComponentDefinitionDefined,
  ComponentOptions,
} from '../../../dom_components/model/types';
import EditorModel from '../../../editor/model/Editor';
import { isObject, serialize, toLowerCase } from '../../../utils/mixins';
import DataResolverListener from '../DataResolverListener';
import DataSource from '../DataSource';
import DataVariable, { DataVariableProps, DataVariableType } from '../DataVariable';
import { ensureComponentInstance, isDataVariable } from '../../utils';
import {
  DataCollectionItemType,
  DataCollectionType,
  keyCollectionDefinition,
  keyCollectionsStateMap,
  keyIsCollectionItem,
} from './constants';
import {
  ComponentDataCollectionProps,
  DataCollectionDataSource,
  DataCollectionProps,
  DataCollectionState,
  DataCollectionStateMap,
} from './types';
import { getSymbolsToUpdate } from '../../../dom_components/model/SymbolUtils';
import { StyleProps, UpdateStyleOptions } from '../../../domain_abstract/model/StyleableModel';
import { updateFromWatcher } from '../../../dom_components/model/ComponentDataResolverWatchers';
import Components from '../../../dom_components/model/Components';
import ComponentDataOutput from '../conditional_variables/ComponentDataOutput';

export default class ComponentDataCollection extends Component {
  dataSourceWatcher?: DataResolverListener;

  get defaults(): ComponentDefinitionDefined {
    return {
      // @ts-ignore
      ...super.defaults,
      droppable: false,
      type: DataCollectionType,
      components: [
        {
          type: DataCollectionItemType,
        },
      ],
    };
  }

  constructor(props: ComponentDataCollectionProps, opt: ComponentOptions) {
    const collectionDef = props[keyCollectionDefinition];

    if (opt.forCloning) {
      return super(props as any, opt) as unknown as ComponentDataCollection;
    }

    const em = opt.em;
    const newProps = { ...props, droppable: false } as any;
    const cmp: ComponentDataCollection = super(newProps, opt) as unknown as ComponentDataCollection;
    if (!collectionDef) {
      em.logError('missing collection definition');
      return cmp;
    }

    this.rebuildChildrenFromCollection();
    bindAll(this, 'rebuildChildrenFromCollection');
    this.listenTo(this, `change:${keyCollectionDefinition}`, this.rebuildChildrenFromCollection);
    this.listenToDataSource();

    return cmp;
  }

  getItemsCount() {
    const items = this.getDataSourceItems();
    const startIndex = Math.max(0, this.getConfigStartIndex() ?? 0);
    const configEndIndex = this.getConfigEndIndex() ?? Number.MAX_VALUE;
    const endIndex = Math.min(items.length - 1, configEndIndex);

    const count = endIndex - startIndex + 1;
    return Math.max(0, count);
  }

  getConfigStartIndex() {
    return this.collectionDef.startIndex;
  }

  getConfigEndIndex() {
    return this.collectionDef.endIndex;
  }

  getDataSource(): DataCollectionDataSource {
    return this.collectionDef?.dataSource;
  }

  getCollectionId(): string {
    return this.collectionDef?.collectionId;
  }

  getCollectionItemComponents() {
    return this.components().at(0).components();
  }

  setStartIndex(startIndex: number): void {
    if (startIndex < 0) {
      this.em.logError('Start index should be greater than or equal to 0');
      return;
    }

    this.updateCollectionConfig({ startIndex });
  }

  setEndIndex(endIndex: number): void {
    this.updateCollectionConfig({ endIndex });
  }

  private updateCollectionConfig(updates: Partial<DataCollectionProps>): void {
    this.set(keyCollectionDefinition, {
      ...this.collectionDef,
      ...updates,
    });
  }

  setDataSource(dataSource: DataCollectionDataSource) {
    this.set(keyCollectionDefinition, {
      ...this.collectionDef,
      dataSource,
    });
  }

  setCollectionItemComponents(content: ComponentAddType) {
    this.components().at(0).components(content);
  }

  private getDataSourceItems() {
    return getDataSourceItems(this.collectionDef.dataSource, this.em);
  }

  private getCollectionStateMap() {
    return (this.get(keyCollectionsStateMap) || {}) as DataCollectionStateMap;
  }

  private get collectionDef() {
    return (this.get(keyCollectionDefinition) || {}) as DataCollectionProps;
  }

  private get collectionDataSource() {
    return this.collectionDef.dataSource;
  }

  private listenToDataSource() {
    const { em } = this;
    const path = this.collectionDataSource?.path;
    if (!path) return;
    this.dataSourceWatcher = new DataResolverListener({
      em,
      resolver: new DataVariable({ type: DataVariableType, path }, { em }),
      onUpdate: this.rebuildChildrenFromCollection,
    });
  }

  private rebuildChildrenFromCollection() {
    this.components().reset(this.getCollectionItems(), updateFromWatcher as any);
  }

  private getCollectionItems() {
    const dataConditionItemModel = this.em.Components.getType(DataCollectionItemType)!.model;
    const firstChild =
      this.components().at(0) ||
      new dataConditionItemModel(
        {
          type: DataCollectionItemType,
        },
        this.opt,
      );
    // TODO: Move to component view
    firstChild.addStyle({ display: 'none' });
    const components: Component[] = [firstChild];

    const result = validateCollectionDef(this.collectionDef, this.em);
    if (!result) {
      return components;
    }

    const collectionId = this.collectionDef.collectionId;
    const items = this.getDataSourceItems();

    const startIndex = this.getConfigStartIndex() ?? 0;
    const configEndIndex = this.getConfigEndIndex() ?? Number.MAX_VALUE;
    const endIndex = Math.min(items.length - 1, configEndIndex);
    const totalItems = endIndex - startIndex + 1;
    const parentCollectionStateMap = this.getCollectionStateMap();
    if (parentCollectionStateMap[collectionId]) {
      this.em.logError(
        `The collection ID "${collectionId}" already exists in the parent collection state. Overriding it is not allowed.`,
      );

      return components;
    }

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

      const collectionsStateMap: DataCollectionStateMap = {
        ...parentCollectionStateMap,
        [collectionId]: collectionState,
      };

      if (isFirstItem) {
        setCollectionStateMapAndPropagate(collectionsStateMap, collectionId)(firstChild);
        // TODO: Move to component view
        firstChild.addStyle({ display: '' });

        continue;
      }

      const instance = firstChild!.clone({ symbol: true });
      instance.set('locked', true);
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
    delete json.droppable;

    const components = new Components(this.components().at(0), this.opt) as any;
    return { ...json, components };
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

function validateCollectionDef(collectionDef: DataCollectionProps, em: EditorModel) {
  const validations = [
    { property: collectionDef?.collectionId, propertyPath: 'collectionDef.collectionId' },
    { property: collectionDef?.dataSource, propertyPath: 'collectionDef.dataSource' },
  ];

  for (const { propertyPath } of validations) {
    if (!logErrorIfMissing(collectionDef, propertyPath, em)) {
      return [];
    }
  }

  const startIndex = collectionDef?.startIndex;

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
      const __onStyleChange = cmp.__onStyleChange.bind(cmp);

      cmp.__onStyleChange = (newStyles: StyleProps, opts: UpdateStyleOptions = {}) => {
        __onStyleChange(newStyles);
        const cmps = getSymbolsToUpdate(cmp);

        cmps.forEach((cmp) => {
          cmp.addStyle(newStyles, opts);
        });
      };

      cmp.on(`change:${keyIsCollectionItem}`, () => {
        cmp.__onStyleChange = __onStyleChange;
      });
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
        items = em.DataSources.getValue(dataSource.path, []);
      }
      break;
    }
    default:
      break;
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
