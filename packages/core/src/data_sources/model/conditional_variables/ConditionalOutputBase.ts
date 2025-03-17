import { ObjectAny } from '../../../common';
import Component, { keySymbol } from '../../../dom_components/model/Component';
import { ComponentDefinition, ComponentDefinitionDefined } from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import { isDataConditionDisplayType } from '../../utils';
import { DataConditionProps, DataConditionType } from './DataCondition';

export interface ComponentDataConditionProps extends DataConditionProps, ComponentDefinition {
  type: typeof DataConditionType;
  ifTrue?: ComponentDefinition;
  ifFalse?: ComponentDefinition;
}

export default class ConditionalOutputBase extends Component {
  get defaults(): ComponentDefinitionDefined {
    return {
      // @ts-ignore
      ...super.defaults,
      stylable: false,
      removable: false,
      droppable: false,
      draggable: false,
    };
  }

  static isComponent(el: HTMLElement) {
    return isDataConditionDisplayType(toLowerCase(el.tagName));
  }

  toJSON(opts?: ObjectAny): ComponentDefinition {
    const json = super.toJSON(opts);
    delete json[keySymbol];
    delete json.components;
    delete json.attributes?.id;

    return json;
  }
}
