import { isArray, isUndefined } from 'underscore';
import { attrToString } from '../../utils/dom';
import Component from './Component';
import ComponentHead, { type as typeHead } from './ComponentHead';
import { ToHTMLOptions } from './types';
import Components from './Components';
import DataResolverListener from '../../data_sources/model/DataResolverListener';
import { DataVariableProps } from '../../data_sources/model/DataVariable';
import { DataCollectionStateMap } from '../../data_sources/model/data_collection/types';
import ComponentWithCollectionsState, { DataVariableMap } from '../../data_sources/model/ComponentWithCollectionsState';

export const keyRootData = '__rootData';


export default class ComponentWrapper extends ComponentWithCollectionsState<DataVariableProps> {
  dataSourceWatcher?: DataResolverListener;

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

  constructor(props: any, opt: any) {
    super(props, opt);

    const hasDataResolver = this.getDataResolver();

    if (hasDataResolver) {
      this.syncComponentsCollectionState();
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

  protected listenToPropsChange() {
    this.on(`change:dataResolver`, () => {
      this.onCollectionsStateMapUpdate(this.getCollectionsStateMap());
      this.listenToDataSource();
    });

    this.listenToDataSource();
  }

  private getCollectionsStateMapForItem(items: DataVariableProps[] | DataVariableMap, key: number | string) {
    const totalItems = Object.keys(items).length;
    let item: DataVariableProps = (items as any)[key];
    const numericKey = typeof key === 'string' ? Object.keys(items).indexOf(key) : key;
    const offset = numericKey - 0;
    const remainingItems = totalItems - (1 + offset);
    const collectionState = {
      collectionId: keyRootData,
      currentIndex: numericKey,
      currentItem: item,
      currentKey: key,
      startIndex: 0,
      endIndex: totalItems - 1,
      totalItems: totalItems,
      remainingItems,
    };

    return collectionState;
  }

  private getCollectionsStateMap(): DataCollectionStateMap {
    const path = this.dataSourcePath;
    if (!path) return this.collectionsStateMap;
    const items = this.getDataSourceItems();
    const pages = [];
    const length = Object.keys(items).length;
    for (let index = 0; index <= length; index++) {
      const key = this.getItemKey(items, index);
      const collectionsStateMap = this.getCollectionsStateMapForItem(items, key);
      pages.push(collectionsStateMap);
    }

    const collectionsStateMap = {
      __pages: { currentItem: pages },
    };

    return collectionsStateMap as any;
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
