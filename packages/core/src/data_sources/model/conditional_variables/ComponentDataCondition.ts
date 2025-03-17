import { bindAll } from 'underscore';
import Component from '../../../dom_components/model/Component';
import {
  ComponentDefinition as ComponentProperties,
  ComponentDefinitionDefined,
  ComponentOptions,
} from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import { DataConditionIfFalseType, DataConditionIfTrueType, DataConditionOutputType } from '../../constants';
import { ensureComponentInstance, isDataConditionDisplayType } from '../../utils';
import { DataCondition, DataConditionProps, DataConditionType } from './DataCondition';
import { ConditionProps } from './DataConditionEvaluator';
import { StringOperation } from './operators/StringOperator';
import { DataConditionDisplayType } from '../../types';

export interface ComponentDataConditionProps extends DataConditionProps, ComponentProperties {
  type: typeof DataConditionType;
  ifTrue?: ComponentProperties;
  ifFalse?: ComponentProperties;
}

export default class ComponentDataCondition extends Component {
  dataResolver: DataCondition;

  get defaults(): ComponentDefinitionDefined {
    return {
      // @ts-ignore
      ...super.defaults,
      type: DataConditionType,
      condition: {
        left: '',
        operator: StringOperation.equalsIgnoreCase,
        right: '',
      },
      ifTrue: {},
      ifFalse: {},
      droppable: false,
      components: {
        type: DataConditionOutputType,
      },
    };
  }

  constructor(props: ComponentDataConditionProps, opt: ComponentOptions) {
    const ifTrue = ensureComponentInstance(props.ifTrue, opt);
    const ifFalse = ensureComponentInstance(props.ifFalse, opt);
    const updatedProps = {
      ...props,
      ifTrue: ifTrue,
      ifFalse: ifFalse,
    } as any;
    super(updatedProps, opt);
    bindAll(this, 'syncChildState', 'initIfTrueComponents', 'initIfFalseComponents', 'initOutputComponents');

    this.dataResolver = new DataCondition(updatedProps, { em: opt.em });
    this.dataResolver.onValueChange = this.initOutputComponents;

    this.initIfTrueComponents();
    this.initIfFalseComponents();
    this.initOutputComponents();
    this.listenTo(this.components(), 'add', this.syncChildState);

    this.listenToPropsChange();
  }

  isTrue() {
    return this.dataResolver.isTrue();
  }

  getCondition() {
    return this.dataResolver.getCondition();
  }

  getIfTrue(): Component {
    return this.get('ifTrue');
  }

  getIfFalse(): Component {
    return this.get('ifFalse');
  }

  setCondition(newCondition: ConditionProps) {
    this.set('condition', newCondition);
  }

  setIfTrue(newIfTrue: ComponentProperties) {
    this.set('ifTrue', ensureComponentInstance(newIfTrue, this.opt));
  }

  setIfFalse(newIfFalse: ComponentProperties) {
    this.set('ifFalse', ensureComponentInstance(newIfFalse, this.opt));
  }

  private initIfTrueComponents() {
    return this.initComponentsByType({
      event: 'change:ifTrue',
      componentType: DataConditionIfTrueType,
    });
  }

  private initIfFalseComponents() {
    return this.initComponentsByType({
      event: 'change:ifFalse',
      componentType: DataConditionIfFalseType,
    });
  }

  private initOutputComponents() {
    return this.initComponentsByType({
      event: 'change:condition',
      componentType: DataConditionOutputType,
    });
  }

  private initComponentsByType(config: { event: string; componentType: DataConditionDisplayType }) {
    const { event, componentType } = config;

    const toListen: [ComponentDataCondition, string, () => void] = [
      this,
      event,
      () => this.initComponentsByType(config),
    ];

    this.stopListening(...toListen);
    this.ensureSymbol(componentType);

    const componentsToSync = this.getDescendantComponentsByType(componentType);
    componentsToSync.forEach((cmp) => {
      const instance = this.getSymbolInstanceByType(componentType);
      cmp.components(instance);
    });

    this.listenTo(...toListen);
    return this;
  }

  private ensureSymbol(componentType: DataConditionDisplayType) {
    if (componentType === DataConditionOutputType) return;

    const symbol = this.get(componentType);
    this.set(componentType, ensureComponentInstance(symbol, this.opt));
  }

  private shouldUpdateOutputComponents(componentType: DataConditionDisplayType): boolean {
    const isOutputComponent = componentType === DataConditionOutputType;
    const isTrueConditionMet = this.isTrue() && componentType === DataConditionIfTrueType;
    const isFalseConditionMet = !this.isTrue() && componentType === DataConditionIfFalseType;

    return !isOutputComponent && (isTrueConditionMet || isFalseConditionMet);
  }

  private getDescendantComponentsByType(type: DataConditionDisplayType) {
    const shouldUpdateOutputComponents = this.shouldUpdateOutputComponents(type);

    return this.components().filter((cmp) => {
      return cmp.get('type') === type || (cmp.get('type') === DataConditionOutputType && shouldUpdateOutputComponents);
    });
  }

  private listenToPropsChange() {
    const properties: (keyof DataConditionProps)[] = ['condition', 'ifTrue', 'ifFalse'];

    properties.forEach((property) => {
      this.listenTo(this, `change:${property}`, (_, newValue: any) => {
        this.dataResolver.set(property, newValue);
      });
    });
  }

  private syncChildState(cmp: Component) {
    const type = cmp.get('type')!;

    if (!isDataConditionDisplayType(type)) return;

    const instance = this.getSymbolInstanceByType(type);

    cmp.components(instance);
  }

  private getSymbolInstanceByType(type: DataConditionDisplayType): Component {
    return this.getSymbolByType(type).clone({ symbol: true });
  }

  private getSymbolByType(type: DataConditionDisplayType): Component {
    switch (type) {
      case DataConditionOutputType:
        return this.isTrue() ? this.getIfTrue() : this.getIfFalse();
      case DataConditionIfTrueType:
        return this.getIfTrue();
      case DataConditionIfFalseType:
        return this.getIfFalse();
      default:
        return this.getIfTrue();
    }
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === DataConditionType;
  }
}
