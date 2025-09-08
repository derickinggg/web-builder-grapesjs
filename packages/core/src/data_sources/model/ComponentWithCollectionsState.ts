import { DataCollectionStateMap } from '../../data_sources/model/data_collection/types';
import DataResolverListener from '../../data_sources/model/DataResolverListener';
import DataVariable, { DataVariableProps, DataVariableType } from '../../data_sources/model/DataVariable';
import Components from '../../dom_components/model/Components';
import Component from '../../dom_components/model/Component';
import { ObjectAny } from '../../common';
import { isDataVariable } from '../utils';
import { isObject } from '../../utils/mixins';
import DataSource from './DataSource';
import { isArray } from 'underscore';

export type DataVariableMap = Record<string, DataVariableProps>;

export type DataSourceRecords = DataVariableProps[] | DataVariableMap;

export default class ComponentWithCollectionsState<DataResolverType> extends Component {
  collectionsStateMap: DataCollectionStateMap = {};
  dataSourceWatcher?: DataResolverListener;

  constructor(props: any, opt: any) {
    super(props, opt);
    this.listenToPropsChange();
  }

  onCollectionsStateMapUpdate(collectionsStateMap: DataCollectionStateMap) {
    this.collectionsStateMap = collectionsStateMap;
    this.dataResolverWatchers?.onCollectionsStateMapUpdate?.();

    this.components().forEach((cmp) => {
      cmp.onCollectionsStateMapUpdate?.(collectionsStateMap);
    });
  }

  syncOnComponentChange(model: Component, collection: Components, opts: any) {
    const prev = this.collectionsStateMap;
    this.collectionsStateMap = {};
    super.syncOnComponentChange(model, collection, opts);
    this.collectionsStateMap = prev;
    this.onCollectionsStateMapUpdate(prev);
  }

  syncComponentsCollectionState() {
    super.syncComponentsCollectionState();
    this.components().forEach((cmp) => cmp.syncComponentsCollectionState?.());
  }

  setDataResolver(dataResolver: DataResolverType | undefined) {
    return this.set('dataResolver', dataResolver);
  }

  getDataResolver(): DataResolverType | undefined {
    return this.get('dataResolver');
  }

  protected listenToDataSource() {
    const path = this.dataSourcePath;
    if (!path) return;

    const { em } = this;
    this.dataSourceWatcher = new DataResolverListener({
      em,
      resolver: new DataVariable(
        { type: DataVariableType, path },
        { em, collectionsStateMap: this.collectionsStateMap },
      ),
      onUpdate: () => this.onDataSourceChange(),
    });
  }

  protected listenToPropsChange() {
    this.on(`change:dataResolver`, () => {
      this.listenToDataSource();
    });

    this.listenToDataSource();
  }

  protected get dataSourceProps(): DataVariableProps | undefined {
    return this.get('dataResolver');
  }

  protected get dataSourcePath(): string | undefined {
    return this.dataSourceProps?.path;
  }

  protected onDataSourceChange() {
    this.onCollectionsStateMapUpdate(this.collectionsStateMap);
  }

  protected getDataSourceItems() {
    const dataSourceProps = this.dataSourceProps;
    if (!dataSourceProps) return [];
    const items = this.listDataSourceItems(dataSourceProps);
    if (items && isArray(items)) {
      return items;
    }

    const clone = { ...items };
    delete clone['__p'];
    return clone;
  }

  protected listDataSourceItems(dataSource: DataSource | DataVariableProps): DataSourceRecords {
    const em = this.em;
    switch (true) {
      case isObject(dataSource) && dataSource instanceof DataSource: {
        const id = dataSource.get('id')!;
        return this.listDataSourceVariables(id);
      }
      case isDataVariable(dataSource): {
        const path = dataSource.path;
        if (!path) return [];
        const isDataSourceId = path.split('.').length === 1;
        if (isDataSourceId) {
          return this.listDataSourceVariables(path);
        } else {
          return em.DataSources.getValue(path, []);
        }
      }
      default:
        return [];
    }
  }

  protected getItemKey(items: DataVariableProps[] | { [x: string]: DataVariableProps }, index: number) {
    return isArray(items) ? index : Object.keys(items)[index];
  }

  private removePropsListeners() {
    this.off(`change:dataResolver`);
    this.dataSourceWatcher?.destroy();
    this.dataSourceWatcher = undefined;
  }

  private listDataSourceVariables(path: string): DataVariableProps[] {
    const records = this.em.DataSources.getValue(path, []);
    const keys = Object.keys(records);

    return keys.map((key) => ({
      type: DataVariableType,
      path: path + '.' + key,
    }));
  }

  destroy(options?: ObjectAny): false | JQueryXHR {
    this.removePropsListeners();
    return super.destroy(options);
  }
}
