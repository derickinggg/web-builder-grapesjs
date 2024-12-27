import { ObjectAny } from '../../common';
import EditorModel from '../../editor/model/Editor';
import Component from './Component';
import { DynamicValueWatcher } from './DynamicValueWatcher';

export class ComponentDynamicValueWatcher {
  private propertyWatcher: DynamicValueWatcher;
  private attributeWatcher: DynamicValueWatcher;

  constructor(
    private component: Component,
    em: EditorModel,
  ) {
    this.propertyWatcher = new DynamicValueWatcher(this.createPropertyUpdater(), em);
    this.attributeWatcher = new DynamicValueWatcher(this.createAttributeUpdater(), em);
  }

  private createPropertyUpdater() {
    return (key: string, value: any) => {
      this.component.set(key, value, { skipWatcherUpdates: true, avoidStore: true });
    };
  }

  private createAttributeUpdater() {
    return (key: string, value: any) => {
      this.component.addAttributes({ [key]: value }, { skipWatcherUpdates: true, avoidStore: true });
    };
  }

  watchComponentDef(values: ObjectAny) {
    this.addProps(values);
    this.addAttributes(values.attributes);
  }

  addProps(props: ObjectAny) {
    this.propertyWatcher.addDynamicValues(props);
  }

  getDynamicPropsDefs() {
    return this.propertyWatcher.getAllSerializableValues();
  }

  setAttributes(attributes: ObjectAny) {
    this.attributeWatcher.setDynamicValues(attributes);
  }

  addAttributes(attributes: ObjectAny) {
    this.attributeWatcher.addDynamicValues(attributes);
  }

  removeAttributes(attributes: string[]) {
    this.attributeWatcher.removeListeners(attributes);
  }

  getAttributesDefsOrValues(attributes: ObjectAny) {
    return this.attributeWatcher.getSerializableValues(attributes);
  }

  getPropsDefsOrValues(props: ObjectAny) {
    return this.propertyWatcher.getSerializableValues(props);
  }

  destroy() {
    this.propertyWatcher.removeListeners();
    this.attributeWatcher.removeListeners();
  }
}
