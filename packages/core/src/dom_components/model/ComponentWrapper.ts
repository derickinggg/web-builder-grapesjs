import { isUndefined } from 'underscore';
import { attrToString } from '../../utils/dom';
import Component from './Component';
import ComponentHead, { type as typeHead } from './ComponentHead';
import { ComponentOptions, ComponentProperties, ToHTMLOptions } from './types';
import Components from './Components';
import DataResolverListener from '../../data_sources/model/DataResolverListener';
import { DataVariableProps } from '../../data_sources/model/DataVariable';
import { DataCollectionStateMap } from '../../data_sources/model/data_collection/types';
import ComponentWithCollectionsState, {
  DataSourceRecords,
} from '../../data_sources/model/ComponentWithCollectionsState';
import { keyRootData } from '../constants';

type ResolverCurrentItemType = string | number | undefined;

export default class ComponentWrapper extends ComponentWithCollectionsState<DataVariableProps> {
  dataSourceWatcher?: DataResolverListener;
  _resolverCurrentItem: ResolverCurrentItemType;

  get defaults() {
    return {
      // @ts-ignore
      ...super.defaults,
      tagName: 'body',
      removable: false,
      copyable: false,
      draggable: false,
      components: [],
      traits: [],
      doctype: '',
      head: null,
      docEl: null,
      stylable: [
        'background',
        'background-color',
        'background-image',
        'background-repeat',
        'background-attachment',
        'background-position',
        'background-size',
      ],
    };
  }

  constructor(props: ComponentProperties = {}, opt: ComponentOptions) {
    super(props, opt);

    const hasDataResolver = this.getDataResolver();
    this.syncComponentsCollectionState();

    if (hasDataResolver) {
      this.onCollectionsStateMapUpdate(this.getCollectionsStateMap());
    }
  }

  preInit() {
    const { opt, attributes: props } = this;
    const cmp = this.em?.Components;
    const CmpHead = cmp?.getType(typeHead)?.model;
    const CmpDef = cmp?.getType('default').model;
    if (CmpHead) {
      const { head, docEl } = props;
      this.set(
        {
          head: head && head instanceof Component ? head : new CmpHead({ ...head }, opt),
          docEl: docEl && docEl instanceof Component ? docEl : new CmpDef({ tagName: 'html', ...docEl }, opt),
        },
        { silent: true },
      );
    }
  }

  get head(): ComponentHead {
    return this.get('head');
  }

  get docEl(): Component {
    return this.get('docEl');
  }

  get doctype(): string {
    return this.attributes.doctype || '';
  }

  clone(opt?: { symbol?: boolean | undefined; symbolInv?: boolean | undefined }): this {
    const result = super.clone(opt);
    result.set('head', this.get('head').clone(opt));
    result.set('docEl', this.get('docEl').clone(opt));

    return result;
  }

  toHTML(opts: ToHTMLOptions = {}) {
    const { doctype } = this;
    const asDoc = !isUndefined(opts.asDocument) ? opts.asDocument : !!doctype;
    const { head, docEl } = this;
    const body = super.toHTML(opts);
    const headStr = (asDoc && head?.toHTML(opts)) || '';
    const docElAttr = (asDoc && attrToString(docEl?.getAttrToHTML())) || '';
    const docElAttrStr = docElAttr ? ` ${docElAttr}` : '';
    return asDoc ? `${doctype}<html${docElAttrStr}>${headStr}${body}</html>` : body;
  }

  onCollectionsStateMapUpdate(collectionsStateMap: DataCollectionStateMap) {
    const { page, head } = this;
    super.onCollectionsStateMapUpdate(collectionsStateMap);
    head.onCollectionsStateMapUpdate(collectionsStateMap);
    if (page) page.collectionsStateMap = collectionsStateMap;
  }

  syncComponentsCollectionState() {
    super.syncComponentsCollectionState();
    this.head.syncComponentsCollectionState();
  }

  syncOnComponentChange(model: Component, collection: Components, opts: any) {
    const collectionsStateMap: any = this.getCollectionsStateMap();

    this.collectionsStateMap = collectionsStateMap;
    super.syncOnComponentChange(model, collection, opts);
    this.onCollectionsStateMapUpdate(collectionsStateMap);
  }

  get resolverCurrentItem() {
    return this._resolverCurrentItem;
  }

  set resolverCurrentItem(value: ResolverCurrentItemType) {
    this._resolverCurrentItem = value;
    this.onCollectionsStateMapUpdate(this.getCollectionsStateMap());
  }

  protected listenToPropsChange() {
    this.on(`change:dataResolver`, () => {
      this.onCollectionsStateMapUpdate(this.getCollectionsStateMap());
      this.listenToDataSource();
    });

    this.listenToDataSource();
  }

  private getCollectionsStateMap(): DataCollectionStateMap {
    const { dataSourcePath, resolverCurrentItem } = this;

    if (!dataSourcePath) return {};

    const items = this.getDataSourceItems();

    if (!isUndefined(resolverCurrentItem)) {
      const selected = items[resolverCurrentItem as keyof DataSourceRecords];
      return {
        [keyRootData]: selected,
      } as DataCollectionStateMap;
    }

    return {
      [keyRootData]: items,
    } as DataCollectionStateMap;
  }

  __postAdd() {
    const um = this.em?.UndoManager;
    !this.__hasUm && um?.add(this);
    return super.__postAdd();
  }

  __postRemove() {
    const um = this.em?.UndoManager;
    um?.remove(this);
    return super.__postRemove();
  }

  static isComponent() {
    return false;
  }
}
