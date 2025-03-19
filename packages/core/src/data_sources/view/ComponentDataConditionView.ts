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

    this.listenTo(this.model.components(), 'reset', this.postRender.bind(this));
    this.dataResolverListener = new DataResolverListener({
      em: this.em,
      resolver: this.model.dataResolver,
      onUpdate: this.postRender.bind(this),
    });
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

  renderDataResolver() {
    const componentTrue = this.model.getIfTrueContent();
    const componentFalse = this.model.getIfFalseContent();

    const elTrue = componentTrue?.getEl();
    const elFalse = componentFalse?.getEl();

    const isTrue = this.model.isTrue();
    if (elTrue) {
      elTrue.style.display = isTrue ? '' : 'none';
    }
    if (elFalse) {
      elFalse.style.display = isTrue ? 'none' : '';
    }
  }

  postRender() {
    this.renderDataResolver();
    super.postRender();
  }

  remove() {
    this.stopListening(this.model.components(), 'reset', this.postRender.bind(this));
    this.dataResolverListener.destroy();
    return super.remove();
  }
}
