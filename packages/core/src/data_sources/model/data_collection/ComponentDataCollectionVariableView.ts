import ComponentView from '../../../dom_components/view/ComponentView';
import DynamicVariableListenerManager from '../DataVariableListenerManager';
import ComponentDataCollectionVariable from './ComponentDataCollectionVariable';

export default class ComponentDataCollectionVariableView extends ComponentView<ComponentDataCollectionVariable> {
  collectionVariableListener?: DynamicVariableListenerManager;

  initialize(opt = {}) {
    super.initialize(opt);
    this.postRender();

    this.collectionVariableListener = new DynamicVariableListenerManager({
      em: this.em!,
      dataVariable: this.model.datacollectionVariable,
      updateValueFromDataVariable: this.postRender,
    });
  }

  postRender() {
    const { model, el } = this;
    if (!el) return;
    el.innerHTML = model.datacollectionVariable.getDataValue();

    super.postRender();
  }
}
