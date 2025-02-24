import Component from '../../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions } from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import { DataCondition, DataConditionProps, DataConditionType } from './DataCondition';

export default class ComponentDataCondition extends Component {
  dataResolver: DataCondition;

  constructor(props: DataConditionProps, opt: ComponentOptions) {
    const dataConditionInstance = new DataCondition(props, { em: opt.em });

    super(
      {
        ...props,
        type: DataConditionType,
        components: dataConditionInstance.getDataValue(),
      },
      opt,
    );
    this.dataResolver = dataConditionInstance;
    this.dataResolver.onValueChange = this.handleConditionChange.bind(this);
  }

  private handleConditionChange() {
    this.components(this.dataResolver.getDataValue());
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataConditionType;
  }

  toJSON(): ComponentDefinition {
    return this.dataResolver.toJSON();
  }
}
