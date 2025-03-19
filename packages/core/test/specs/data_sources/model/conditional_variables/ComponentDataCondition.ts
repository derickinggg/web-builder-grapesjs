import { Component, Components, ComponentView, DataSourceManager, Editor } from '../../../../../src';
import { DataConditionIfTrueType } from '../../../../../src/data_sources/model/conditional_variables/constants';
import { DataVariableType } from '../../../../../src/data_sources/model/DataVariable';
import { DataConditionType } from '../../../../../src/data_sources/model/conditional_variables/DataCondition';
import { AnyTypeOperation } from '../../../../../src/data_sources/model/conditional_variables/operators/AnyTypeOperator';
import { NumberOperation } from '../../../../../src/data_sources/model/conditional_variables/operators/NumberOperator';
import ComponentDataConditionView from '../../../../../src/data_sources/view/ComponentDataConditionView';
import ComponentWrapper from '../../../../../src/dom_components/model/ComponentWrapper';
import ComponentTextView from '../../../../../src/dom_components/view/ComponentTextView';
import EditorModel from '../../../../../src/editor/model/Editor';
import {
  DummyTextNode,
  DummyTextNodeText,
  FALSE_CONDITION,
  ifFalseComponentDef,
  ifFalseText,
  ifTrueComponentDef,
  ifTrueText,
  isObjectContained,
  newIfFalseComponentDef,
  newIfFalseText,
  newIfTrueComponentDef,
  newIfTrueText,
  setupTestEditor,
  TRUE_CONDITION,
} from '../../../../common';
import ComponentDataCondition from '../../../../../src/data_sources/model/conditional_variables/ComponentDataCondition';

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
      dataResolver: { condition: TRUE_CONDITION },
      components: [ifTrueComponentDef],
    })[0] as ComponentDataCondition;
    expect(component).toBeDefined();
    expect(component.get('type')).toBe(DataConditionType);
    expect(component.getInnerHTML()).toContain(ifTrueText);

    const componentView = component.getView();
    expect(componentView).toBeInstanceOf(ComponentDataConditionView);
    expect(componentView?.el.textContent).toBe(ifTrueText);

    const childComponent = component.getOutputContent()![0];
    const childView = childComponent.getView();
    expect(childComponent).toBeDefined();
    expect(childComponent.get('type')).toBe('text');
    expect(childComponent.getInnerHTML()).toContain(ifTrueText);
    expect(childView).toBeInstanceOf(ComponentTextView);
    expect(childView?.el.innerHTML).toBe(ifTrueText);
  });

  it('should add a component with a condition that evaluates a string', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      dataResolver: { condition: TRUE_CONDITION },
      components: [ifTrueComponentDef],
    })[0] as ComponentDataCondition;
    expect(component).toBeDefined();
    expect(component.get('type')).toBe(DataConditionType);
    expect(component.getInnerHTML()).toContain(ifTrueText);
    const componentView = component.getView();
    expect(componentView).toBeInstanceOf(ComponentDataConditionView);
    expect(componentView?.el.textContent).toBe(ifTrueText);

    const childComponent = component.getOutputContent()![0];
    const childView = childComponent.getView();
    expect(childComponent).toBeDefined();
    expect(childComponent.get('type')).toBe('text');
    expect(childComponent.getInnerHTML()).toContain(ifTrueText);
    expect(childView).toBeInstanceOf(ComponentTextView);
    expect(childView?.el.innerHTML).toBe(ifTrueText);
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
      dataResolver: {
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
      },
      components: [ifTrueComponentDef, ifFalseComponentDef],
    })[0] as ComponentDataCondition;

    let outputComponent = component.getOutputContent()![0];
    expect(outputComponent).toBeDefined();
    expect(outputComponent.get('type')).toBe('text');
    expect(outputComponent.getInnerHTML()).toContain(ifTrueText);

    /* Test changing datasources */
    const WrongValue = 'Diffirent value';
    changeDataSourceValue(dsm, WrongValue);
    outputComponent = component.getOutputContent()![0];
    expect(outputComponent.getInnerHTML()).toContain(ifFalseText);
    expect(outputComponent.getView()?.el.innerHTML).toBe(ifFalseText);

    const CorrectValue = 'Name1';
    changeDataSourceValue(dsm, CorrectValue);
    outputComponent = component.getOutputContent()![0];
    expect(outputComponent.getInnerHTML()).toContain(ifTrueText);
    expect(outputComponent.getView()?.el.innerHTML).toBe(ifTrueText);
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
      dataResolver: {
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
      },
      components: [
        {
          type: DataConditionIfTrueType,
          components: {
            type: DataConditionType,
            dataResolver: {
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
            },
            components: ifTrueComponentDef,
          },
        },
      ],
    })[0] as ComponentDataCondition;

    const childComponent = component.getOutputContent()![0] as ComponentDataCondition;
    const innerComponent = childComponent.getOutputContent()![0];
    const innerComponentView = innerComponent.getView();
    expect(innerComponent.getInnerHTML()).toContain(ifTrueText);
    expect(innerComponentView).toBeInstanceOf(ComponentTextView);
    expect(innerComponentView?.el.tagName).toBe('H1');
  });

  it('should store conditional components', () => {
    const conditionalCmptDef = {
      type: DataConditionType,
      dataResolver: { condition: FALSE_CONDITION },
      components: [ifTrueComponentDef, ifFalseComponentDef],
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
      dataResolver: { condition: TRUE_CONDITION },
      components: [ifTrueComponentDef, DummyTextNode, ifFalseComponentDef],
    })[0] as ComponentDataCondition;
    const view = component.view!;

    const components = component.components();
    view.postRender = displayAllChildren(components, view);
    view.postRender();

    const childrenNodes = view?.el.childNodes!;
    expect(childrenNodes[0].textContent).toContain(ifTrueText);
    expect(childrenNodes[1].textContent).toContain(DummyTextNodeText);
    expect(childrenNodes[2].textContent).toContain(ifFalseText);
  });

  it('should dynamically display ifFalse and output components when condition is false', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      dataResolver: { condition: FALSE_CONDITION },
      components: [ifTrueComponentDef, DummyTextNode, ifFalseComponentDef],
    })[0] as ComponentDataCondition;
    const view = component.view!;

    const components = component.components();
    view.postRender = displayAllChildren(components, view);
    view.postRender();

    const childrenNodes = view?.el.childNodes!;
    expect(childrenNodes[0].textContent).toContain(ifTrueText);
    expect(childrenNodes[1].textContent).toContain(DummyTextNodeText);
    expect(childrenNodes[2].textContent).toContain(ifFalseText);
  });

  it('should handle updating display components with nested conditional components', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      dataResolver: { condition: TRUE_CONDITION },
      components: [
        {
          type: DataConditionIfTrueType,
          components: {
            type: DataConditionType,
            dataResolver: { condition: TRUE_CONDITION },
            components: [ifTrueComponentDef],
          },
        },
        ifFalseComponentDef,
      ],
    })[0] as ComponentDataCondition;

    expect(component.view?.el.innerHTML).toContain(ifTrueText);
  });

  it('should dynamically update display components when data source changes', () => {
    const dataSource = {
      id: 'ds1',
      records: [{ id: 'left_id', left: 1 }],
    };
    dsm.add(dataSource);

    const component = cmpRoot.append({
      type: DataConditionType,
      dataResolver: {
        condition: {
          left: {
            type: DataVariableType,
            path: 'ds1.left_id.left',
          },
          operator: NumberOperation.greaterThan,
          right: 0,
        },
      },
      components: [ifTrueComponentDef, ifFalseComponentDef],
    })[0] as ComponentDataCondition;

    let view = component.view!;
    expect(view.el.innerHTML).toContain(ifTrueText);

    changeDataSourceValue(dsm, -1);
    expect(view.el.innerHTML).toContain(ifFalseText);
  });

  it('should display all components passed via cmp.components([...])', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      dataResolver: { condition: TRUE_CONDITION },
      components: [ifTrueComponentDef, ifFalseComponentDef],
    })[0] as ComponentDataCondition;

    component.components([newIfTrueComponentDef, DummyTextNode, newIfFalseComponentDef]);

    const el = component.view!.el;

    expect(el.innerHTML).toContain(newIfTrueText);
  });

  it('should update content of ifTrue, ifFalse, and output components when condition changes', () => {
    const component = cmpRoot.append({
      type: DataConditionType,
      dataResolver: { condition: TRUE_CONDITION },
      components: [ifTrueComponentDef, ifFalseComponentDef],
    })[0] as ComponentDataCondition;

    component.components([newIfTrueComponentDef, newIfFalseComponentDef]);

    let el = component.view!.el;
    expect(el.innerHTML).toContain(newIfTrueText);

    component.set('condition', FALSE_CONDITION);
    expect(el.innerHTML).toContain(newIfFalseText);
  });

  it('should dynamically update components when data source changes', () => {
    const dataSource = {
      id: 'ds1',
      records: [{ id: 'left_id', left: 1 }],
    };
    dsm.add(dataSource);

    const component = cmpRoot.append({
      type: DataConditionType,
      dataResolver: {
        condition: {
          left: {
            type: DataVariableType,
            path: 'ds1.left_id.left',
          },
          operator: NumberOperation.greaterThan,
          right: 0,
        },
      },
      components: [ifTrueComponentDef, ifFalseComponentDef],
    })[0] as ComponentDataCondition;

    component.components([newIfTrueComponentDef, newIfFalseComponentDef]);

    let el = component.view!.el;
    expect(el.innerHTML).toContain(newIfTrueText);

    changeDataSourceValue(dsm, -1);
    expect(el.innerHTML).toContain(newIfFalseText);
  });
});

function displayAllChildren(components: Components, view: ComponentView<Component>): () => void {
  return () => {
    const arr = components.map((cmp) => {
      const frag = document.createDocumentFragment();
      view.childrenView?.addToCollection(cmp, frag);

      return frag;
    });

    view.el.replaceChildren(...arr);
  };
}

function changeDataSourceValue(dsm: DataSourceManager, newValue: string | number) {
  dsm.get('ds1').getRecord('left_id')?.set('left', newValue);
}
