import { bindAll } from 'underscore';
import ComponentView from '../../dom_components/view/ComponentView';
import ComponentDataCondition from '../model/conditional_variables/ComponentDataCondition';
import {
  DataConditionEvaluationChangedEvent,
  DataConditionOutputChangedEvent,
} from '../model/conditional_variables/DataCondition';
import DataResolverListener from '../model/DataResolverListener';

export default class ComponentDataConditionView extends ComponentView<ComponentDataCondition> {
  dataResolverListener!: DataResolverListener;

  initialize(opt = {}) {
    super.initialize(opt);

    bindAll(this, 'postRender');
    this.listenTo(this.model, DataConditionOutputChangedEvent, this.postRender);
    this.listenTo(this.model.dataResolver, DataConditionEvaluationChangedEvent, this.postRender);
  }

  getOutputContent() {
    return this.model.getOutputContent();
  }

  getIfTrueContent() {
    return this.model.getIfTrueContent();
  }

  getIfFalseContent() {
    return this.model.getIfFalseContent();
  }

  postRender() {
    this.el.innerHTML = '';
    this.getOutputContent()?.forEach((cmp) => {
      const outputEl = cmp?.getEl();
      outputEl && this.el.append(outputEl);
    });

    super.postRender();
  }

  remove() {
    this.stopListening(this.model, DataConditionEvaluationChangedEvent, this.postRender);
    this.dataResolverListener.destroy();
    return super.remove();
  }
}
