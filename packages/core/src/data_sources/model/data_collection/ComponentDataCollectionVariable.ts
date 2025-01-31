import Component from '../../../dom_components/model/Component';
import { ComponentOptions } from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import DataCollectionVariable from './DataCollectionVariable';
import { DataCollectionVariableType, keyCollectionsStateMap } from './constants';
import { ComponentDataCollectionVariableProps, DataCollectionStateMap } from './types';

export default class ComponentDataCollectionVariable extends Component {
  datacollectionVariable: DataCollectionVariable;

  get defaults() {
    // @ts-expect-error
    const componentDefaults = super.defaults;

    return {
      ...componentDefaults,
      type: DataCollectionVariableType,
      collectionId: undefined,
      variableType: undefined,
      path: undefined,
    };
  }

  constructor(props: ComponentDataCollectionVariableProps, opt: ComponentOptions) {
    super(props, opt);
    const em = opt.em;
    const { type, variableType, path, collectionId } = props;

    this.datacollectionVariable = new DataCollectionVariable(
      { type, variableType, path, collectionId },
      {
        em,
        collectionsStateMap: this.get(keyCollectionsStateMap),
      },
    );

    this.listenTo(this, `change:${keyCollectionsStateMap}`, this.handleCollectionsMapStateUpdate);
  }

  private handleCollectionsMapStateUpdate(m: any, v: DataCollectionStateMap, opts = {}) {
    this.datacollectionVariable.updateCollectionsStateMap(v);
  }

  getDataValue() {
    return this.datacollectionVariable.getDataValue();
  }

  getInnerHTML() {
    return this.getDataValue();
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataCollectionVariableType;
  }
}
