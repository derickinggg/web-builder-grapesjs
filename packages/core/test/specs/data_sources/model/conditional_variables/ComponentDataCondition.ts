import { Component, DataSourceManager, Editor } from '../../../../../src';
import { ObjectAny } from '../../../../../src/common';
import {
  DataConditionIfTrueType,
  DataConditionIfFalseType,
  DataConditionOutputType,
} from '../../../../../src/data_sources/constants';
import { DataVariableType } from '../../../../../src/data_sources/model/DataVariable';
import { DataConditionType } from '../../../../../src/data_sources/model/conditional_variables/DataCondition';
import { AnyTypeOperation } from '../../../../../src/data_sources/model/conditional_variables/operators/AnyTypeOperator';
import { NumberOperation } from '../../../../../src/data_sources/model/conditional_variables/operators/NumberOperator';
import ComponentDataConditionView from '../../../../../src/data_sources/view/ComponentDataConditionView';
import ComponentWrapper from '../../../../../src/dom_components/model/ComponentWrapper';
import ComponentTextView from '../../../../../src/dom_components/view/ComponentTextView';
import EditorModel from '../../../../../src/editor/model/Editor';
import {
  newIfFalseComponentDef,
  newIfFalseContent,
  newIfTrueComponentDef,
  newIfTrueContent,
  setupTestEditor,
} from '../../../../common';
import { ifFalseComponentDef, ifFalseContent, ifTrueComponentDef, ifTrueContent } from '../../../../common';

function isObjectContained(received: ObjectAny, expected: ObjectAny): boolean {
  return Object.keys(expected).every((key) => {
    if (typeof expected[key] === 'object' && expected[key] !== null) {
      return isObjectContained(received[key], expected[key]);
    }

    return received[key] === expected[key];
  });
}

describe('ComponentDataCondition', () => {
  let editor: Editor;
  let em: EditorModel;
  let dsm: DataSourceManager;
  let cmpRoot: ComponentWrapper;

  beforeEach(() => {
    ({ editor, em, dsm, cmpRoot } = setupTestEditor());
  });

  afterEach(() => {
    em.destroy();
  });

  it('should add a component with a condition that evaluates a component definition', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: ifTrueComponentDef,
    })[0];
    expect(component).toBeDefined();
    expect(component.get('type')).toBe(DataConditionType);
    expect(component.getInnerHTML()).toContain(ifTrueContent);
    const componentView = component.getView();
    expect(componentView).toBeInstanceOf(ComponentDataConditionView);
    expect(componentView?.el.textContent).toBe(ifTrueContent);

    const childComponent = getFirstGrandchild(component);
    const childView = getFirstGrandchildView(component);
    expect(childComponent).toBeDefined();
    expect(childComponent.get('type')).toBe('text');
    expect(childComponent.getInnerHTML()).toContain(ifTrueContent);
    expect(childView).toBeInstanceOf(ComponentTextView);
    expect(childView?.el.innerHTML).toBe(ifTrueContent);
  });

  it('should add a component with a condition that evaluates a string', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: ifTrueComponentDef,
    })[0];
    expect(component).toBeDefined();
    expect(component.get('type')).toBe(DataConditionType);
    expect(component.getInnerHTML()).toContain(ifTrueContent);
    const componentView = component.getView();
    expect(componentView).toBeInstanceOf(ComponentDataConditionView);
    expect(componentView?.el.textContent).toBe(ifTrueContent);

    const childComponent = getFirstGrandchild(component);
    const childView = getFirstGrandchildView(component);
    expect(childComponent).toBeDefined();
    expect(childComponent.get('type')).toBe('text');
    expect(childComponent.getInnerHTML()).toContain(ifTrueContent);
    expect(childView).toBeInstanceOf(ComponentTextView);
    expect(childView?.el.innerHTML).toBe(ifTrueContent);
  });

  it('should test component variable with data-source', () => {
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
    })[0];

    const childComponent = getFirstGrandchild(component);
    expect(childComponent).toBeDefined();
    expect(childComponent.get('type')).toBe('text');
    expect(childComponent.getInnerHTML()).toContain(ifTrueContent);

    /* Test changing datasources */
    changeDataSourceValue(dsm, 'Diffirent value');
    expect(getFirstGrandchild(component).getInnerHTML()).toContain(ifFalseContent);
    expect(getFirstGrandchildView(component)?.el.innerHTML).toBe(ifFalseContent);
    changeDataSourceValue(dsm, 'Name1');
    expect(getFirstGrandchild(component).getInnerHTML()).toContain(ifTrueContent);
    expect(getFirstGrandchildView(component)?.el.innerHTML).toBe(ifTrueContent);
  });

  it('should test a conditional component with a child that is also a conditional component', () => {
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
      ifTrue: {
        tagName: 'div',
        components: [
          {
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
          },
        ],
      },
    })[0];

    const innerComponent = getFirstGrandchild(component).components().at(0);
    const innerComponentView = getFirstGrandchildView(innerComponent);
    expect(innerComponent.getInnerHTML()).toContain(ifTrueContent);
    expect(innerComponentView).toBeInstanceOf(ComponentTextView);
    expect(innerComponentView?.el.tagName).toBe('H1');
  });

  it('should store conditional components', () => {
    const conditionalCmptDef = {
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: -1,
      },
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    };

    cmpRoot.append(conditionalCmptDef)[0];

    const projectData = editor.getProjectData();
    const page = projectData.pages[0];
    const frame = page.frames[0];
    const storageCmptDef = frame.component.components[0];
    expect(isObjectContained(storageCmptDef, conditionalCmptDef)).toBe(true);
  });

  it('should dynamically display ifTrue, ifFalse, and output components in the correct order', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 1,
        operator: NumberOperation.greaterThan,
        right: 0,
      },
      components: [
        { type: DataConditionIfTrueType },
        { type: 'text', content: 'Default Text' },
        { type: DataConditionIfFalseType },
        { type: DataConditionOutputType },
      ],
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0];

    const children = component.components();
    expect(children.length).toBe(4);

    expect(children.at(0).get('type')).toBe(DataConditionIfTrueType);
    expect(children.at(0).getInnerHTML()).toContain(ifTrueContent);

    expect(children.at(1).get('type')).toBe('text');
    expect(children.at(1).getInnerHTML()).toContain('Default Text');

    expect(children.at(2).get('type')).toBe(DataConditionIfFalseType);
    expect(children.at(2).getInnerHTML()).toContain(ifFalseContent);

    expect(children.at(3).get('type')).toBe(DataConditionOutputType);
    expect(children.at(3).getInnerHTML()).toContain(ifTrueContent);
  });

  it('should dynamically display ifFalse and output components when condition is false', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 0,
        operator: NumberOperation.greaterThan,
        right: 1,
      },
      components: [
        { type: DataConditionIfTrueType },
        { type: 'text', content: 'Default Text' },
        { type: DataConditionIfFalseType },
        { type: DataConditionOutputType },
      ],
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0];

    const children = component.components();
    expect(children.length).toBe(4);

    expect(children.at(0).get('type')).toBe(DataConditionIfTrueType);
    expect(children.at(0).getInnerHTML()).toContain(ifTrueContent);

    expect(children.at(1).get('type')).toBe('text');
    expect(children.at(1).getInnerHTML()).toContain('Default Text');

    expect(children.at(2).get('type')).toBe(DataConditionIfFalseType);
    expect(children.at(2).getInnerHTML()).toContain(ifFalseContent);

    expect(children.at(3).get('type')).toBe(DataConditionOutputType);
    expect(children.at(3).getInnerHTML()).toContain(ifFalseContent);
  });

  it('should handle updating display components with nested conditional components', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 1,
        operator: NumberOperation.greaterThan,
        right: 0,
      },
      components: [
        {
          type: DataConditionType,
          condition: {
            left: 1,
            operator: NumberOperation.greaterThan,
            right: 0,
          },
          ifTrue: ifTrueComponentDef,
        },
        { type: DataConditionOutputType },
      ],
      ifTrue: newIfTrueComponentDef,
    })[0];

    const children = component.components();
    expect(children.length).toBe(2);

    const nestedComponent = children.at(0);
    expect(nestedComponent.get('type')).toBe(DataConditionType);
    expect(nestedComponent.getInnerHTML()).toContain(ifTrueContent);

    expect(children.at(1).get('type')).toBe(DataConditionOutputType);
    expect(children.at(1).getInnerHTML()).toContain(newIfTrueContent);
  });

  it('should dynamically update display components when data source changes', () => {
    const dataSource = {
      id: 'ds1',
      records: [{ id: 'left_id', left: 1 }],
    };
    dsm.add(dataSource);

    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: {
          type: DataVariableType,
          path: 'ds1.left_id.left',
        },
        operator: NumberOperation.greaterThan,
        right: 0,
      },
      components: [{ type: DataConditionIfTrueType }, { type: DataConditionOutputType }],
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0];

    let children = component.components();
    expect(children.at(0).getInnerHTML()).toContain(ifTrueContent);
    expect(children.at(1).getInnerHTML()).toContain(ifTrueContent);

    changeDataSourceValue(dsm, -1);
    children = component.components();
    expect(children.at(0).getInnerHTML()).toContain(ifTrueContent);
    expect(children.at(1).getInnerHTML()).toContain(ifFalseContent);
  });

  it('should display all components passed via cmp.components([...])', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 1,
        operator: NumberOperation.greaterThan,
        right: 0,
      },
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0];

    component.components([
      { type: DataConditionIfTrueType },
      { type: 'text', content: 'Default Text' },
      { type: DataConditionIfFalseType },
      { type: DataConditionOutputType },
    ]);

    const children = component.components();
    expect(children.length).toBe(4);

    expect(children.at(0).get('type')).toBe(DataConditionIfTrueType);
    expect(children.at(0).getInnerHTML()).toContain(ifTrueContent);

    expect(children.at(1).get('type')).toBe('text');
    expect(children.at(1).getInnerHTML()).toContain('Default Text');

    expect(children.at(2).get('type')).toBe(DataConditionIfFalseType);
    expect(children.at(2).getInnerHTML()).toContain(ifFalseContent);

    expect(children.at(3).get('type')).toBe(DataConditionOutputType);
    expect(children.at(3).getInnerHTML()).toContain(ifTrueContent);
  });

  it('should update content of ifTrue, ifFalse, and output components when condition changes', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: 1,
        operator: NumberOperation.greaterThan,
        right: 0,
      },
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0];

    component.components([
      { type: DataConditionIfTrueType },
      { type: DataConditionIfFalseType },
      { type: DataConditionOutputType },
    ]);

    let children = component.components();
    expect(children.at(0).getInnerHTML()).toContain(ifTrueContent);
    expect(children.at(1).getInnerHTML()).toContain(ifFalseContent);
    expect(children.at(2).getInnerHTML()).toContain(ifTrueContent);

    component.set('condition', {
      left: 0,
      operator: NumberOperation.greaterThan,
      right: 1,
    });
    children = component.components();
    expect(children.at(0).getInnerHTML()).toContain(ifTrueContent);
    expect(children.at(1).getInnerHTML()).toContain(ifFalseContent);
    expect(children.at(2).getInnerHTML()).toContain(ifFalseContent);
  });

  it('should dynamically update components when data source changes', () => {
    const dataSource = {
      id: 'ds1',
      records: [{ id: 'left_id', left: 1 }],
    };
    dsm.add(dataSource);

    const component = cmpRoot.append({
      type: DataConditionType,
      condition: {
        left: {
          type: DataVariableType,
          path: 'ds1.left_id.left',
        },
        operator: NumberOperation.greaterThan,
        right: 0,
      },
      ifTrue: ifTrueComponentDef,
      ifFalse: ifFalseComponentDef,
    })[0];

    component.components([
      { type: DataConditionIfTrueType },
      { type: DataConditionIfFalseType },
      { type: DataConditionOutputType },
    ]);

    let children = component.components();
    expect(children.at(0).getInnerHTML()).toContain(ifTrueContent);
    expect(children.at(1).getInnerHTML()).toContain(ifFalseContent);
    expect(children.at(2).getInnerHTML()).toContain(ifTrueContent);

    changeDataSourceValue(dsm, -1);
    children = component.components();
    expect(children.at(0).getInnerHTML()).toContain(ifTrueContent);
    expect(children.at(1).getInnerHTML()).toContain(ifFalseContent);
    expect(children.at(2).getInnerHTML()).toContain(ifFalseContent);
  });
});

function changeDataSourceValue(dsm: DataSourceManager, newValue: string | number) {
  dsm.get('ds1').getRecord('left_id')?.set('left', newValue);
}

function getFirstGrandchildView(component: Component) {
  return getFirstGrandchild(component).getView();
}

function getFirstGrandchild(component: Component) {
  return component.components().at(0)?.components().at(0);
}
