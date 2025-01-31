import { DataSourcesEvents, DataVariableListener } from '../types';
import { stringToPath } from '../../utils/mixins';
import { Model } from '../../common';
import EditorModel from '../../editor/model/Editor';
import DataVariable, { DataVariableType } from './DataVariable';
import { DynamicValue } from '../types';
import { DataCondition, DataConditionType } from './conditional_variables/DataCondition';
import { DataCollectionVariableType } from './data_collection/constants';
import DataCollectionVariable from './data_collection/DataCollectionVariable';

export interface DynamicVariableListenerManagerOptions {
  em: EditorModel;
  dataVariable: DynamicValue;
  updateValueFromDataVariable: (value: any) => void;
}

export default class DynamicVariableListenerManager {
  private dataListeners: DataVariableListener[] = [];
  private em: EditorModel;
  dynamicVariable: DynamicValue;
  private updateValueFromDynamicVariable: (value: any) => void;
  private model = new Model();

  constructor(options: DynamicVariableListenerManagerOptions) {
    this.em = options.em;
    this.dynamicVariable = options.dataVariable;
    this.updateValueFromDynamicVariable = options.updateValueFromDataVariable;

    this.listenToDynamicVariable();
  }

  private onChange = () => {
    const value = this.dynamicVariable.getDataValue();
    this.updateValueFromDynamicVariable(value);
  };

  listenToDynamicVariable() {
    const { dynamicVariable } = this;
    this.removeListeners();
    let dataListeners: DataVariableListener[] = [];
    // @ts-ignore
    const type = dynamicVariable.get('type');

    switch (type) {
      case DataCollectionVariableType:
        dataListeners = this.listenToDataCollectionVariable(dynamicVariable as DataCollectionVariable);
        break;
      case DataVariableType:
        dataListeners = this.listenToDataVariable(dynamicVariable as DataVariable);
        break;
      case DataConditionType:
        dataListeners = this.listenToConditionalVariable(dynamicVariable as DataCondition);
        break;
    }

    dataListeners.forEach((ls) => this.model.listenTo(ls.obj, ls.event, this.onChange));
    this.dataListeners = dataListeners;
  }

  private listenToConditionalVariable(dataVariable: DataCondition) {
    const { em } = this;
    const dataListeners = dataVariable.getDependentDataVariables().flatMap((dataVariable) => {
      return this.listenToDataVariable(new DataVariable(dataVariable, { em }));
    });

    return dataListeners;
  }

  private listenToDataVariable(dataVariable: DataVariable) {
    const { em } = this;
    const dataListeners: DataVariableListener[] = [];
    const { path } = dataVariable.attributes;
    const normPath = stringToPath(path || '').join('.');
    const [ds, dr] = em.DataSources.fromPath(path);
    ds && dataListeners.push({ obj: ds.records, event: 'add remove reset' });
    dr && dataListeners.push({ obj: dr, event: 'change' });
    dataListeners.push(
      { obj: dataVariable, event: 'change:path change:defaultValue' },
      { obj: em.DataSources.all, event: 'add remove reset' },
      { obj: em, event: `${DataSourcesEvents.path}:${normPath}` },
    );

    return dataListeners;
  }

  private listenToDataCollectionVariable(dataVariable: DataCollectionVariable) {
    return [{ obj: dataVariable, event: 'change:value' }];
  }

  private removeListeners() {
    this.dataListeners.forEach((ls) => this.model.stopListening(ls.obj, ls.event, this.onChange));
    this.dataListeners = [];
  }

  destroy() {
    this.removeListeners();
  }
}
