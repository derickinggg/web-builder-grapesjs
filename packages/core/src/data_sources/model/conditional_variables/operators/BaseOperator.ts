import EditorModel from '../../../../editor/model/Editor';
import { Operation } from './types';

export abstract class Operator<OperationType extends Operation> {
  protected em: EditorModel;
  protected operation: OperationType;

  constructor(operation: any, opts: { em: EditorModel }) {
    this.operation = operation;
    this.em = opts.em;
  }

  abstract evaluate(left: any, right: any): boolean;
}
