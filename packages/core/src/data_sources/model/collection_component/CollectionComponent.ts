import { DataVariableDefinition, DataVariableType } from './../DataVariable';
import { isArray } from 'underscore';
import Component from '../../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions, ComponentProperties } from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import { ConditionDefinition } from '../conditional_variables/DataCondition';
import DataSource from '../DataSource';
import { ObjectAny } from '../../../common';
import EditorModel from '../../../editor/model/Editor';

export const CollectionComponentType = 'collection-component';
export const CollectionVariableType = 'parent-collection-variable';

type CollectionVariable = {
  type: typeof CollectionVariableType;
  variable_type: keyof CollectionState;
  collection_name?: string;
  path?: string;
};

type CollectionDataSource = any[] | DataVariableDefinition | CollectionVariable;

type CollectionConfig = {
  start_index?: number;
  end_index?: number | ConditionDefinition;
  dataSource: CollectionDataSource;
};

type CollectionState = {
  current_index: number;
  start_index: number;
  current_item: any;
  end_index: number;
  collection_name?: string;
  total_items: number;
  remaining_items: number;
};

type CollectionsStateMap = {
  [key: string]: CollectionState;
};

type CollectionDefinition = {
  type: typeof CollectionComponentType;
  collection_name?: string;
  config: CollectionConfig;
  block: ComponentDefinition;
};

export const collectionDefinitionKey = 'collectionDefinition';
export const collectionsStateMapKey = 'collectionsItems';
export const innerCollectionStateKey = 'innerCollectionState';

export default class CollectionComponent extends Component {
  constructor(props: CollectionDefinition & ComponentProperties, opt: ComponentOptions) {
    const em = opt.em;
    const { collection_name, block, config } = props[collectionDefinitionKey];
    if (!block) {
      throw new Error('The "block" property is required in the collection definition.');
    }

    if (!config?.dataSource) {
      throw new Error('The "config.dataSource" property is required in the collection definition.');
    }

    let items: any[] = getDataSourceItems(config.dataSource, em);
    const components: ComponentDefinition[] = [];
    const start_index = Math.max(0, config.start_index || 0);
    const end_index = Math.min(items.length - 1, config.end_index || Number.MAX_VALUE);

    const total_items = end_index - start_index + 1;
    let blockComponent: Component;
    for (let index = start_index; index <= end_index; index++) {
      const item = items[index];
      const collectionState: CollectionState = {
        collection_name,
        current_index: index,
        current_item: item,
        start_index: start_index,
        end_index: end_index,
        total_items: total_items,
        remaining_items: total_items - (index + 1),
      };

      const collectionsStateMap: CollectionsStateMap = {
        ...props[collectionsStateMapKey],
        ...(collection_name && { [collection_name]: collectionState }),
        [innerCollectionStateKey]: collectionState,
      };

      if (index === start_index) {
        const { clonedBlock } = resolveBlockValues(collectionsStateMap, block);
        const type = em.Components.getType(clonedBlock?.type || 'default');
        const model = type.model;
        blockComponent = new model(clonedBlock, opt);
      }
      const instance = em.Components.addSymbol(blockComponent!);
      const cmpDefinition = resolveComponent(instance!, block, collectionsStateMap, em);

      components.push(cmpDefinition);
    }

    const conditionalCmptDef = {
      ...props,
      type: CollectionComponentType,
      components: components,
      dropbbable: false,
    };
    // @ts-ignore
    super(conditionalCmptDef, opt);
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === CollectionComponentType;
  }
}

function getDataSourceItems(dataSource: any, em: EditorModel) {
  let items: any[] = [];
  switch (true) {
    case isArray(dataSource):
      items = dataSource;
      break;
    case typeof dataSource === 'object' && dataSource instanceof DataSource:
      const id = dataSource.get('id')!;
      items = listDataSourceVariables(id, em);
      break;
    case typeof dataSource === 'object' && dataSource.type === DataVariableType:
      const isDataSourceId = dataSource.path.split('.').length === 1;
      if (isDataSourceId) {
        const id = dataSource.path;
        items = listDataSourceVariables(id, em);
      } else {
        // Path points to a record in the data source
        items = em.DataSources.getValue(dataSource.path, []);
      }
      break;
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

function resolveComponent(
  component: Component,
  block: ComponentDefinition,
  collectionsStateMap: CollectionsStateMap,
  em: EditorModel,
) {
  const { resolvedCollectionValues } = resolveBlockValues(collectionsStateMap, block);
  Object.keys(resolvedCollectionValues).length && component!.setSymbolOverride(Object.keys(resolvedCollectionValues));
  component!.set(resolvedCollectionValues);

  const children: ComponentDefinition[] = [];
  for (let index = 0; index < component!.components().length; index++) {
    const childSymbol = component!.components().at(index);
    const childBlock = block['components']![index];
    const childJSON = resolveComponent(childSymbol, childBlock, collectionsStateMap, em);
    children.push(childJSON);
  }

  const componentJSON = component!.toJSON();
  const componentDefinition: ComponentDefinition = {
    ...componentJSON,
    components: children,
    [collectionsStateMapKey]: collectionsStateMap
  };

  return componentDefinition;
}

function resolveBlockValues(collectionsStateMap: CollectionsStateMap, block: ObjectAny) {
  const clonedBlock = deepCloneObject(block);
  const resolvedCollectionValues: ObjectAny = {};

  if (typeof clonedBlock === 'object') {
    const blockKeys = Object.keys(clonedBlock);
    for (const key of blockKeys) {
      let blockValue = clonedBlock[key];
      if (key === collectionDefinitionKey) continue;
      let hasCollectionVariable = false;

      if (typeof blockValue === 'object') {
        const isCollectionVariable = blockValue.type === CollectionVariableType;
        if (isCollectionVariable) {
          const {
            variable_type,
            collection_name = innerCollectionStateKey,
            path = '',
          } = blockValue as CollectionVariable;
          const collectionItem = collectionsStateMap[collection_name];
          if (!collectionItem) {
            throw new Error(`Collection not found: ${collection_name}`);
          }
          if (!variable_type) {
            throw new Error(`Missing collection variable type for collection: ${collection_name}`);
          }
          clonedBlock[key] = resolveCurrentItem(variable_type, collectionItem, path);

          hasCollectionVariable = true;
        } else if (Array.isArray(blockValue)) {
          clonedBlock[key] = blockValue.map((arrayItem: any) => {
            const { clonedBlock, resolvedCollectionValues: itemOverrideKeys } = resolveBlockValues(
              collectionsStateMap,
              arrayItem,
            );
            if (!isEmptyObject(itemOverrideKeys)) {
              hasCollectionVariable = true;
            }

            return typeof arrayItem === 'object' ? clonedBlock : arrayItem;
          });
        } else {
          const { clonedBlock, resolvedCollectionValues: itemOverrideKeys } = resolveBlockValues(
            collectionsStateMap,
            blockValue,
          );
          clonedBlock[key] = clonedBlock;

          if (!isEmptyObject(itemOverrideKeys)) {
            hasCollectionVariable = true;
          }
        }

        if (hasCollectionVariable && key !== 'components') {
          resolvedCollectionValues[key] = clonedBlock[key];
        }
      }
    }
  }

  return { clonedBlock, resolvedCollectionValues };
}

function resolveCurrentItem(
  variableType: CollectionVariable['variable_type'],
  collectionItem: CollectionState,
  path: string,
) {
  const valueIsDataVariable = collectionItem.current_item?.type === DataVariableType;
  if (variableType === 'current_item' && valueIsDataVariable) {
    const currentItem_path = collectionItem.current_item.path;
    const resolvedPath = currentItem_path ? `${currentItem_path}.${path}` : path;
    return {
      ...collectionItem.current_item,
      path: resolvedPath,
    };
  }
  return collectionItem[variableType];
}

function isEmptyObject(itemOverrideKeys: ObjectAny) {
  return Object.keys(itemOverrideKeys).length === 0;
}

/**
 * Deeply clones an object.
 * @template T The type of the object to clone.
 * @param {T} obj The object to clone.
 * @returns {T} A deep clone of the object, or the original object if it's not an object or is null. Returns undefined if input is undefined.
 */
function deepCloneObject<T extends Record<string, any> | null | undefined>(obj: T): T {
  if (obj === null) return null as T;
  if (obj === undefined) return undefined as T;
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return obj; // Return primitives directly
  }

  const clonedObj: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepCloneObject(obj[key]);
    }
  }

  return clonedObj as T;
}
