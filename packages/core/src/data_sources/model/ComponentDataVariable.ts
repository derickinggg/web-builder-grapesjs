import { ModelDestroyOptions } from 'backbone';
import { ObjectAny } from '../../common';
import Component from '../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions, ComponentProperties } from '../../dom_components/model/types';
import { toLowerCase } from '../../utils/mixins';
import DataVariable, { DataVariableProps, DataVariableType } from './DataVariable';
import { DataCollectionStateMap } from './data_collection/types';
import { keyCollectionsStateMap } from './data_collection/constants';

export interface ComponentDataVariableProps extends ComponentProperties {
  type?: typeof DataVariableType;
  dataResolver?: DataVariableProps;
}

export default class ComponentDataVariable extends Component {
  dataResolver: DataVariable;

  get defaults() {
    return {
      // @ts-ignore
      ...super.defaults,
      type: DataVariableType,
      dataResolver: {},
      droppable: false,
    };
  }

  constructor(props: ComponentDataVariableProps, opt: ComponentOptions) {
    super(props, opt);

    this.dataResolver = new DataVariable(props.dataResolver ?? {}, {
      ...opt,
      collectionsStateMap: this.get(keyCollectionsStateMap),
    });

    this.listenToPropsChange();
  }

  getPath() {
    return this.dataResolver.get('path');
  }

  getDefaultValue() {
    return this.dataResolver.get('defaultValue');
  }

  getDataValue() {
    return this.dataResolver.getDataValue();
  }

  getInnerHTML() {
    return this.getDataValue();
  }

  setPath(newPath: string) {
    this.dataResolver.set('path', newPath);
  }

  setDefaultValue(newValue: string) {
    this.dataResolver.set('defaultValue', newValue);
  }

  private listenToPropsChange() {
    this.listenTo(
      this.dataResolver,
      'change',
      (() => {
        this.__changesUp({ m: this });
      }).bind(this),
    );
    this.on('change:dataResolver', () => {
      this.dataResolver.set(this.get('dataResolver'));
    });
    this.on(`change:${keyCollectionsStateMap}`, (_: Component, value: DataCollectionStateMap) => {
      this.dataResolver.updateCollectionsStateMap(value);
    });
  }

  toJSON(opts?: ObjectAny): ComponentDefinition {
    const json = super.toJSON(opts);
    const dataResolver: DataVariableProps = this.dataResolver.toJSON();
    delete dataResolver.type;

    return {
      ...json,
      dataResolver,
    };
  }

  destroy(options?: ModelDestroyOptions | undefined): false | JQueryXHR {
    this.stopListening(this.dataResolver, 'change');
    this.off('change:dataResolver');
    this.off(`change:${keyCollectionsStateMap}`);
    return super.destroy(options);
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataVariableType;
  }
}
