import { Operator } from './operators/BaseOperator';
import { Operation } from './operators/types';

export class ConditionStatement {
  constructor(
    private leftValue: any,
    private operator: Operator<Operation>,
    private rightValue: any,
  ) {}

  evaluate(): boolean {
    return this.operator.evaluate(this.leftValue, this.rightValue);
  }
}
