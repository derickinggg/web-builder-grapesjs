import { Model } from '../../../common';
import EditorModel from '../../../editor/model/Editor';
import DataVariable, { DataVariableProps } from '../DataVariable';
import DataResolverListener from '../DataResolverListener';
import { resolveDynamicValue, isDataVariable } from '../../utils';
import { DataConditionEvaluator, ConditionProps } from './DataConditionEvaluator';
import { AnyTypeOperation } from './operators/AnyTypeOperator';
import { BooleanOperation } from './operators/BooleanOperator';
import { NumberOperation } from './operators/NumberOperator';
import { StringOperation } from './operators/StringOperator';
import { isUndefined } from 'underscore';
import { ComponentSetOptions } from '../../../dom_components/model/Component';

export const DataConditionType = 'data-condition';

export interface ExpressionProps {
  left?: any;
  operator?: AnyTypeOperation | StringOperation | NumberOperation;
  right?: any;
}

export interface LogicGroupProps {
  logicalOperator: BooleanOperation;
  statements: ConditionProps[];
}

export interface DataConditionProps {
  type: typeof DataConditionType;
  condition: ConditionProps;
  ifTrue?: any;
  ifFalse?: any;
}

interface DataConditionPropsDefined extends Omit<DataConditionProps, 'condition'> {
  condition: DataConditionEvaluator;
}

export class DataCondition extends Model<DataConditionPropsDefined> {
  private em: EditorModel;
  private resolverListeners: DataResolverListener[] = [];
  private _onValueChange?: () => void;

  // @ts-ignore
  defaults() {
    return {
      type: DataConditionType,
      condition: {
        left: '',
        operator: StringOperation.equalsIgnoreCase,
        right: '',
      },
      ifTrue: {},
      ifFalse: {},
    };
  }

  constructor(
    props: {
      condition: ConditionProps;
      type?: typeof DataConditionType;
      ifTrue?: any;
      ifFalse?: any;
    },
    opts: { em: EditorModel; onValueChange?: () => void },
  ) {
    if (isUndefined(props.condition)) {
      opts.em.logError('No condition was provided to a conditional component.');
    }

    // @ts-ignore
    super(props, opts);
    this.em = opts.em;

    this.initConditionEvaluator();
    this.listenToDataVariables();
    this._onValueChange = opts.onValueChange;

    this.listenTo(this, 'change:condition change:ifTrue change:ifFalse', () => {
      this.listenToDataVariables();
      this._onValueChange?.();
    });
  }

  getCondition(): ConditionProps {
    return this.conditionEvaluator.get('condition')!;
  }

  getIfTrue() {
    return this.get('ifTrue');
  }

  getIfFalse() {
    return this.get('ifFalse');
  }

  setCondition(condition: ConditionProps, opts?: ComponentSetOptions) {
    const conditionInstance = new DataConditionEvaluator({ condition }, { em: this.em });

    this.set('condition', conditionInstance, opts);
  }

  setIfTrue(newIfTrue: any) {
    this.set('ifTrue', newIfTrue);
  }

  setIfFalse(newIfFalse: any) {
    this.set('ifFalse', newIfFalse);
  }

  isTrue(): boolean {
    return this.conditionEvaluator.evaluate();
  }

  getDataValue(skipDynamicValueResolution: boolean = false): any {
    const ifTrue = this.getIfTrue();
    const ifFalse = this.getIfFalse();

    const isConditionTrue = this.isTrue();
    if (skipDynamicValueResolution) {
      return isConditionTrue ? ifTrue : ifFalse;
    }

    return isConditionTrue ? resolveDynamicValue(ifTrue, this.em) : resolveDynamicValue(ifFalse, this.em);
  }

  set onValueChange(newFunction: () => void) {
    this._onValueChange = newFunction;
  }

  private initConditionEvaluator() {
    const event = 'change:condition';
    const toListen = [this, event, this.initConditionEvaluator];

    this.stopListening(...toListen);

    this.ensureConditionEvaluatorInstance();

    // @ts-ignore
    this.listenTo(...toListen);
    return this;
  }

  private ensureConditionEvaluatorInstance() {
    const condition = this.get('condition') ?? {};
    if (condition instanceof DataConditionEvaluator) return condition;

    const instance = new DataConditionEvaluator({ condition }, { em: this.em });
    this.set('condition', instance, { silent: true });
    return instance;
  }

  private get conditionEvaluator() {
    return this.ensureConditionEvaluatorInstance();
  }

  private listenToDataVariables() {
    const { em } = this;
    if (!em) return;

    // Clear previous listeners to avoid memory leaks
    this.cleanupListeners();

    const dataVariables = this.getDependentDataVariables();

    dataVariables.forEach((variable) => {
      const listener = new DataResolverListener({
        em,
        resolver: new DataVariable(variable, { em: this.em }),
        onUpdate: (() => {
          this._onValueChange?.();
        }).bind(this),
      });

      this.resolverListeners.push(listener);
    });
  }

  getDependentDataVariables() {
    const dataVariables: DataVariableProps[] = this.conditionEvaluator.getDependentDataVariables();
    const ifTrue = this.getIfTrue();
    const ifFalse = this.getIfFalse();
    if (isDataVariable(ifTrue)) dataVariables.push(ifTrue);
    if (isDataVariable(ifFalse)) dataVariables.push(ifFalse);

    return dataVariables;
  }

  private cleanupListeners() {
    this.resolverListeners.forEach((listener) => listener.destroy());
    this.resolverListeners = [];
  }

  toJSON() {
    const ifTrue = this.getIfTrue();
    const ifFalse = this.getIfFalse();

    return {
      type: DataConditionType,
      condition: this.conditionEvaluator.toJSON(),
      ifTrue,
      ifFalse,
    };
  }
}
