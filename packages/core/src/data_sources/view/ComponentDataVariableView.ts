import ComponentView from '../../dom_components/view/ComponentView';
import ComponentDataVariable from '../model/ComponentDataVariable';
import DynamicVariableListenerManager from '../model/DataVariableListenerManager';

export default class ComponentDataVariableView extends ComponentView<ComponentDataVariable> {
  dynamicVariableListener?: DynamicVariableListenerManager;

  initialize(opt = {}) {
    super.initialize(opt);
    this.dynamicVariableListener = new DynamicVariableListenerManager({
      em: this.em!,
      dataVariable: this.model,
      updateValueFromDataVariable: () => this.postRender(),
    });
  }

  postRender() {
    this.el.innerHTML = this.model.getDataValue();
    super.postRender();
  }
}
