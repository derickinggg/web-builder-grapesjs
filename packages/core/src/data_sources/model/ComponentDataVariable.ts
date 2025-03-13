import Component from '../../dom_components/model/Component';
import { ComponentOptions } from '../../dom_components/model/types';
import { toLowerCase } from '../../utils/mixins';
import DataVariable, { DataVariableProps, DataVariableType } from './DataVariable';

export default class ComponentDataVariable extends Component {
  dataResolver: DataVariable;

  get defaults() {
    return {
      // @ts-ignore
      ...super.defaults,
      type: DataVariableType,
      path: '',
      defaultValue: '',
      droppable: false,
    };
  }

  constructor({ type, path, defaultValue }: DataVariableProps, opt: ComponentOptions) {
    super({ type, path, defaultValue }, opt);

    this.dataResolver = new DataVariable({ type, path, defaultValue }, opt);

    this.setupChangeListeners();
  }

  private setupChangeListeners() {
    const handleChange = (property: keyof DataVariableProps) => (component: Component, newValue: string) => {
      this.dataResolver.set(property, newValue);
    };

    this.listenTo(this, 'change:path', handleChange('path'));
    this.listenTo(this, 'change:defaultValue', handleChange('defaultValue'));
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
    this.set('path', newPath);
  }

  setDefaultValue(newValue: string) {
    this.set('defaultValue', newValue);
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataVariableType;
  }
}
