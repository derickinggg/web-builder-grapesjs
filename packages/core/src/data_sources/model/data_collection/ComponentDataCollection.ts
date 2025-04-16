import { isArray } from 'underscore';
import { ObjectAny } from '../../../common';
import Component, { keySymbol } from '../../../dom_components/model/Component';
import { ComponentAddType, ComponentDefinitionDefined, ComponentOptions } from '../../../dom_components/model/types';
import EditorModel from '../../../editor/model/Editor';
import { isObject, toLowerCase } from '../../../utils/mixins';
import DataResolverListener from '../DataResolverListener';
import DataSource from '../DataSource';
import DataVariable, { DataVariableProps, DataVariableType } from '../DataVariable';
import { isDataVariable } from '../../utils';
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
import { ModelDestroyOptions } from 'backbone';

const AvoidStoreOptions = { avoidStore: true, partial: true };
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
    const dataResolver = props[keyCollectionDefinition];

    if (opt.forCloning) {
      return super(props as any, opt) as unknown as ComponentDataCollection;
    }

    const em = opt.em;
    const newProps = { ...props, droppable: false } as any;
    const cmp: ComponentDataCollection = super(newProps, opt) as unknown as ComponentDataCollection;
    if (!dataResolver) {
      em.logError('missing collection definition');
      return cmp;
    }

    this.rebuildChildrenFromCollection = this.rebuildChildrenFromCollection.bind(this);
    this.listenToPropsChange();
    this.rebuildChildrenFromCollection();

    return cmp;
  }

  getDataResolver() {
    return this.get('dataResolver');
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
    return this.dataResolver.startIndex;
  }

  getConfigEndIndex() {
    return this.dataResolver.endIndex;
  }

  getDataSource(): DataCollectionDataSource {
    return this.dataResolver?.dataSource;
  }

  getCollectionId(): string {
    return this.dataResolver?.collectionId;
  }

  getCollectionItemComponents() {
    return this.firstChild.components();
  }

  setDataResolver(props: DataCollectionProps) {
    return this.set('dataResolver', props);
  }

  setCollectionId(collectionId: string) {
    this.updateCollectionConfig({ collectionId });
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

  setDataSource(dataSource: DataCollectionDataSource) {
    this.set(keyCollectionDefinition, {
      ...this.dataResolver,
      dataSource,
    });
  }

  setCollectionItemComponents(content: ComponentAddType) {
    this.firstChild.components(content);
  }

  private get firstChild() {
    return this.components().at(0);
  }

  private updateCollectionConfig(updates: Partial<DataCollectionProps>): void {
    this.set(keyCollectionDefinition, {
      ...this.dataResolver,
      ...updates,
    });
  }

  private getDataSourceItems() {
    return getDataSourceItems(this.dataResolver.dataSource, this.em);
  }

  private getCollectionStateMap() {
    return (this.get(keyCollectionsStateMap) || {}) as DataCollectionStateMap;
  }

  private get dataResolver() {
    return (this.get(keyCollectionDefinition) || {}) as DataCollectionProps;
  }

  private get collectionDataSource() {
    return this.dataResolver.dataSource;
  }

  private listenToDataSource() {
    const { em } = this;
    const path = this.collectionDataSource?.path;
    if (!path) return;
    this.dataSourceWatcher = new DataResolverListener({
      em,
      resolver: new DataVariable(
        { type: DataVariableType, path },
        { em, collectionsStateMap: this.get(keyCollectionsStateMap) },
      ),
      onUpdate: this.rebuildChildrenFromCollection,
    });
  }

  private rebuildChildrenFromCollection() {
    this.components().reset(this.getCollectionItems(), updateFromWatcher as any);
  }

  private getCollectionItems() {
    const firstChild = this.ensureFirstChild();
    // TODO: Move to component view
    firstChild.addStyle({ display: 'none' }, AvoidStoreOptions);
    const components: Component[] = [firstChild];

    const result = validateCollectionDef(this.dataResolver, this.em);
    if (!result) {
      return components;
    }

    const collectionId = this.dataResolver.collectionId;
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
        setCollectionStateMapAndPropagate(firstChild, collectionsStateMap, collectionId);
        // TODO: Move to component view
        firstChild.addStyle({ display: '' }, AvoidStoreOptions);

        continue;
      }

      const instance = firstChild!.clone({ symbol: true });
      instance.set('locked', true, AvoidStoreOptions);
      setCollectionStateMapAndPropagate(instance, collectionsStateMap, collectionId);
      components.push(instance);
    }

    return components;
  }

  private ensureFirstChild() {
    const dataConditionItemModel = this.em.Components.getType(DataCollectionItemType)!.model;

    return (
      this.firstChild ||
      new dataConditionItemModel(
        {
          type: DataCollectionItemType,
        },
        this.opt,
      )
    );
  }

  private listenToPropsChange() {
    this.on(`change:${keyCollectionDefinition}`, () => {
      this.rebuildChildrenFromCollection();
      this.listenToDataSource();
    });
    this.listenToDataSource();
  }

  private removePropsListeners() {
    this.off(`change:${keyCollectionDefinition}`);
    this.dataSourceWatcher?.destroy();
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataCollectionType;
  }

  toJSON(opts?: ObjectAny) {
    const json = super.toJSON.call(this, opts) as ComponentDataCollectionProps;
    delete json.droppable;
    delete json[keySymbol];
    delete json.attributes?.id;

    const firstChild = this.firstChild as any;
    return { ...json, components: [firstChild] };
  }

  destroy(options?: ModelDestroyOptions | undefined): false | JQueryXHR {
    this.removePropsListeners();
    return super.destroy(options);
  }
}

function applyToComponentAndChildren(operation: (cmp: Component) => void, component: Component) {
  operation(component);

  component.components().forEach((child) => {
    applyToComponentAndChildren(operation, child);
  });
}

function setCollectionStateMapAndPropagate(
  cmp: Component,
  collectionsStateMap: DataCollectionStateMap,
  collectionId: string,
) {
  applyToComponentAndChildren(() => {
    setCollectionStateMap(collectionsStateMap)(cmp);

    const addListener = (component: Component) => {
      setCollectionStateMapAndPropagate(component, collectionsStateMap, collectionId);
    };

    const listenerKey = `_hasAddListener${collectionId ? `_${collectionId}` : ''}`;
    const cmps = cmp.components();

    const removeListener = (component: Component) => {
      const index = component.collectionStateListeners?.indexOf(listenerKey) ?? -1;
      if (index !== -1) {
        component.collectionStateListeners?.splice(index, 1);
      }

      if (!component.collectionStateListeners?.length) {
        component.off(`change:${keyCollectionsStateMap}`, handleCollectionStateMapChange);
        component.stopListening(component.components(), 'add', addListener);
        component.stopListening(component.components(), 'remove', removeListener);
      }

      const currentCollectionsStateMap = component.get(keyCollectionsStateMap);
      if (currentCollectionsStateMap) {
        component.set(keyCollectionsStateMap, {
          ...currentCollectionsStateMap,
          [collectionId]: undefined,
        });
      }
    };

    const removeAllListeners = (cmp: Component) => {
      cmp.components().forEach((child) => removeAllListeners(child));
      cmp.off(`change:${keyCollectionsStateMap}`);
      cmp.stopListening(cmp.components(), 'add');
      cmp.stopListening(cmp.components(), 'remove');
      cmp.collectionStateListeners = [];
    };

    if (!cmp.collectionStateListeners) {
      cmp.collectionStateListeners = [];
    }

    if (!cmp.collectionStateListeners.length) {
      cmp.on(`change:${keyCollectionsStateMap}`, handleCollectionStateMapChange);
    }

    if (!cmp.collectionStateListeners.includes(listenerKey)) {
      cmp.collectionStateListeners.push(listenerKey);
      cmp.listenTo(cmps, 'add', addListener);
      cmp.listenTo(cmps, 'remove', removeListener);
    }

    cmp.__onDestroy = () => removeAllListeners(cmp);
    cmps.forEach((childCmp) => setCollectionStateMapAndPropagate(childCmp, collectionsStateMap, collectionId));
  }, cmp);
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

function validateCollectionDef(dataResolver: DataCollectionProps, em: EditorModel) {
  const validations = [
    { property: dataResolver?.collectionId, propertyPath: 'dataResolver.collectionId' },
    { property: dataResolver?.dataSource, propertyPath: 'dataResolver.dataSource' },
  ];

  for (const { propertyPath } of validations) {
    if (!logErrorIfMissing(dataResolver, propertyPath, em)) {
      return [];
    }
  }

  const startIndex = dataResolver?.startIndex;

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
    cmp.set(keyCollectionsStateMap, updatedCollectionStateMap, AvoidStoreOptions);
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
      const path = dataSource.path;
      if (!path) break;
      const isDataSourceId = path.split('.').length === 1;
      if (isDataSourceId) {
        items = listDataSourceVariables(path, em);
      } else {
        items = em.DataSources.getValue(path, []);
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
