import { DataSourceManager } from '../../../../../src';
import { DataVariableType } from '../../../../../src/data_sources/model/DataVariable';
import ComponentDataCondition from '../../../../../src/data_sources/model/conditional_variables/ComponentDataCondition';
import { DataConditionType } from '../../../../../src/data_sources/model/conditional_variables/DataCondition';
import { AnyTypeOperation } from '../../../../../src/data_sources/model/conditional_variables/operators/AnyTypeOperator';
import { NumberOperation } from '../../../../../src/data_sources/model/conditional_variables/operators/NumberOperator';
import ComponentDataConditionView from '../../../../../src/data_sources/view/ComponentDataConditionView';
import ComponentWrapper from '../../../../../src/dom_components/model/ComponentWrapper';
import EditorModel from '../../../../../src/editor/model/Editor';
import { setupTestEditor } from '../../../../common';
import {
  ifTrueComponentDef,
  ifFalseComponentDef,
  ifFalseContent,
  newIfTrueComponentDef,
  newIfTrueContent,
  newIfFalseComponentDef,
  newIfFalseContent,
  ifTrueContent,
} from '../../../../common';

describe('ComponentDataCondition Setters', () => {
  let em: EditorModel;
  let dsm: DataSourceManager;
  let cmpRoot: ComponentWrapper;

  beforeEach(() => {
    ({ em, dsm, cmpRoot } = setupTestEditor());
  });

  afterEach(() => {
    em.destroy();
  });

  it('should update the condition using setCondition', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0] as ComponentDataCondition;

    const newFalsyCondition = {
      left: 1,
      operator: NumberOperation.lessThan,
      right: 0,
    };

    component.setCondition(newFalsyCondition);
    expect(component.getCondition()).toEqual(newFalsyCondition);
    expect(component.getInnerHTML()).toContain(ifFalseContent);
  });

  it('should update the ifTrue value using setIfTrue', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0] as ComponentDataCondition;

    component.setIfTrue(newIfTrueComponentDef);
    // expect(component.getIfTrue()).toEqual(newIfTrue);
    expect(component.getInnerHTML()).toContain(newIfTrueContent);
  });

  it('should update the ifFalse value using setIfFalse', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0] as ComponentDataCondition;

    component.setIfFalse(newIfFalseComponentDef);
    // expect(component.getIfFalse()).toEqual(newIfFalse);

    component.setCondition({
      left: 0,
      operator: NumberOperation.lessThan,
      right: -1,
    });
    expect(component.getInnerHTML()).toContain(newIfFalseContent);
  });

  it('should update the data sources and re-evaluate the condition', () => {
    const dataSource = {
      id: 'ds1',
      records: [
        { id: 'left_id', left: 'Name1' },
        { id: 'right_id', right: 'Name1' },
      ],
    };
    dsm.add(dataSource);

    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: {
          type: DataVariableType,
          path: 'ds1.left_id.left',
        },
        operator: AnyTypeOperation.equals,
        right: {
          type: DataVariableType,
          path: 'ds1.right_id.right',
        },
      },
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0] as ComponentDataCondition;

    expect(component.getInnerHTML()).toContain(ifTrueContent);

    changeDataSourceValue(dsm, 'Different value');
    expect(component.getInnerHTML()).toContain(ifFalseContent);

    changeDataSourceValue(dsm, 'Name1');
    expect(component.getInnerHTML()).toContain(ifTrueContent);
  });

  it('should re-render the component when condition, ifTrue, or ifFalse changes', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0] as ComponentDataCondition;

    const componentView = component.getView() as ComponentDataConditionView;

    component.setIfTrue(newIfTrueComponentDef);
    expect(componentView.el.innerHTML).toContain(newIfTrueContent);

    component.setIfFalse(newIfFalseComponentDef);
    component.setCondition({
      left: 0,
      operator: NumberOperation.lessThan,
      right: -1,
    });
    expect(componentView.el.innerHTML).toContain(newIfFalseContent);
  });
});

export const changeDataSourceValue = (dsm: DataSourceManager, newValue: string) => {
  dsm.get('ds1').getRecord('left_id')?.set('left', newValue);
};
