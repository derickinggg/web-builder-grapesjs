import { Model } from '../../../common';
import EditorModel from '../../../editor/model/Editor';
import DataVariable, { DataVariableProps } from '../DataVariable';
import DynamicVariableListenerManager from '../DataVariableListenerManager';
import { evaluateVariable, isDataVariable } from '../utils';
import { Condition, ConditionProps } from './Condition';
import { GenericOperation } from './operators/GenericOperator';
import { LogicalOperation } from './operators/LogicalOperator';
import { NumberOperation } from './operators/NumberOperator';
import { StringOperation } from './operators/StringOperations';

export const DataConditionType = 'data-condition';

export interface ExpressionProps {
  left: any;
  operator: GenericOperation | StringOperation | NumberOperation;
  right: any;
}

export interface LogicGroupProps {
  logicalOperator: LogicalOperation;
  statements: ConditionProps[];
}

export interface DataConditionProps {
  type: typeof DataConditionType;
  condition: ConditionProps;
  ifTrue: any;
  ifFalse: any;
}

interface DataConditionPropsDefined extends Omit<DataConditionProps, 'condition'> {
  condition: Condition;
}

export class DataCondition extends Model<DataConditionPropsDefined> {
  lastEvaluationResult: boolean;
  private em: EditorModel;
  private variableListeners: DynamicVariableListenerManager[] = [];
  private _onValueChange?: () => void;

  constructor(
    condition: ConditionProps,
    public ifTrue: any,
    public ifFalse: any,
    opts: { em: EditorModel; onValueChange?: () => void },
  ) {
    if (typeof condition === 'undefined') {
      throw new MissingConditionError();
    }

    const conditionInstance = new Condition(condition, { em: opts.em });
    super({
      type: DataConditionType,
      condition: conditionInstance,
      ifTrue,
      ifFalse,
    });
    this.em = opts.em;
    this.lastEvaluationResult = this.evaluate();
    this.listenToDataVariables();
    this._onValueChange = opts.onValueChange;
  }

  get condition() {
    return this.get('condition')!;
  }

  evaluate() {
    return this.condition.evaluate();
  }

  getDataValue(): any {
    return this.lastEvaluationResult ? evaluateVariable(this.ifTrue, this.em) : evaluateVariable(this.ifFalse, this.em);
  }

  reevaluate(): void {
    this.lastEvaluationResult = this.evaluate();
  }

  set onValueChange(newFunction: () => void) {
    this._onValueChange = newFunction;
    this.listenToDataVariables();
  }

  private listenToDataVariables() {
    if (!this.em) return;

    // Clear previous listeners to avoid memory leaks
    this.cleanupListeners();

    const dataVariables = this.getDependentDataVariables();

    dataVariables.forEach((variable) => {
      const variableInstance = new DataVariable(variable, { em: this.em });
      const listener = new DynamicVariableListenerManager({
        em: this.em!,
        dataVariable: variableInstance,
        updateValueFromDataVariable: (() => {
          this.reevaluate();
          this._onValueChange?.();
        }).bind(this),
      });

      this.variableListeners.push(listener);
    });
  }

  getDependentDataVariables() {
    const dataVariables: DataVariableProps[] = this.condition.getDataVariables();
    if (isDataVariable(this.ifTrue)) dataVariables.push(this.ifTrue);
    if (isDataVariable(this.ifFalse)) dataVariables.push(this.ifFalse);

    return dataVariables;
  }

  private cleanupListeners() {
    this.variableListeners.forEach((listener) => listener.destroy());
    this.variableListeners = [];
  }

  toJSON() {
    return {
      type: DataConditionType,
      condition: this.condition,
      ifTrue: this.ifTrue,
      ifFalse: this.ifFalse,
    };
  }
}
export class MissingConditionError extends Error {
  constructor() {
    super('No condition was provided to a conditional component.');
  }
}
