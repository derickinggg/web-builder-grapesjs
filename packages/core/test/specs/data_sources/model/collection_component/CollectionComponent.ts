import { Component, DataRecord, DataSource, DataSourceManager } from '../../../../../src';
import { DataVariableType } from '../../../../../src/data_sources/model/DataVariable';
import {
  CollectionComponentType,
  CollectionVariableType,
} from '../../../../../src/data_sources/model/collection_component/constants';
import { CollectionStateVariableType } from '../../../../../src/data_sources/model/collection_component/types';
import EditorModel from '../../../../../src/editor/model/Editor';
import { filterObjectForSnapshot, setupTestEditor } from '../../../../common';
import { getSymbolMain, getSymbolTop } from '../../../../../src/dom_components/model/SymbolUtils';

describe('Collection component', () => {
  let em: EditorModel;
  let dsm: DataSourceManager;
  let dataSource: DataSource;
  let wrapper: Component;
  let firstRecord: DataRecord;
  let secondRecord: DataRecord;

  beforeEach(() => {
    ({ em, dsm } = setupTestEditor());
    wrapper = em.getWrapper()!;
    dataSource = dsm.add({
      id: 'my_data_source_id',
      records: [
        { id: 'user1', user: 'user1', age: '12' },
        { id: 'user2', user: 'user2', age: '14' },
        { id: 'user3', user: 'user3', age: '16' },
      ],
    });

    firstRecord = dataSource.getRecord('user1')!;
    secondRecord = dataSource.getRecord('user2')!;
  });

  afterEach(() => {
    em.destroy();
  });

  test('Should be undroppable', () => {
    const cmp = wrapper.components({
      type: CollectionComponentType,
      collectionDefinition: {
        block: {
          type: 'default',
        },
        config: {
          dataSource: {
            type: DataVariableType,
            path: 'my_data_source_id',
          },
        },
      },
    })[0];

    expect(cmp.get('droppable')).toBe(false);
  });

  test('Collection items should be symbols', () => {
    const cmp = wrapper.components({
      type: CollectionComponentType,
      collectionDefinition: {
        block: {
          type: 'default',
          components: [
            {
              type: 'default',
            },
          ],
        },
        config: {
          dataSource: {
            type: DataVariableType,
            path: 'my_data_source_id',
          },
        },
      },
    })[0];

    expect(cmp.components()).toHaveLength(3);
    cmp.components().forEach((child) => expect(child.get('type')).toBe('default'));
    const children = cmp.components();
    const firstChild = children.at(0);

    children.slice(1).forEach((component) => {
      expect(getSymbolMain(component)).toBe(firstChild);
    });
  });

  describe('Collection variables', () => {
    describe('Properties', () => {
      let cmp: Component;
      let firstChild!: Component;
      let secondChild!: Component;
      let thirdChild!: Component;

      beforeEach(() => {
        cmp = wrapper.components({
          type: CollectionComponentType,
          collectionDefinition: {
            block: {
              type: 'default',
              content: {
                type: CollectionVariableType,
                variable_type: CollectionStateVariableType.current_item,
                path: 'user',
              },
              custom_property: {
                type: CollectionVariableType,
                variable_type: CollectionStateVariableType.current_item,
                path: 'user',
              },
            },
            config: {
              dataSource: {
                type: DataVariableType,
                path: 'my_data_source_id',
              },
            },
          },
        })[0];

        firstChild = cmp.components().at(0);
        secondChild = cmp.components().at(1);
        thirdChild = cmp.components().at(2);
      });

      test('Evaluating to static value', () => {
        expect(firstChild.get('content')).toBe('user1');
        expect(firstChild.get('custom_property')).toBe('user1');

        expect(secondChild.get('content')).toBe('user2');
        expect(secondChild.get('custom_property')).toBe('user2');
      });

      test('Updating the record', async () => {
        firstRecord.set('user', 'new_user1_value');
        expect(firstChild.get('content')).toBe('new_user1_value');
        expect(firstChild.get('custom_property')).toBe('new_user1_value');

        expect(secondChild.get('content')).toBe('user2');
        expect(secondChild.get('custom_property')).toBe('user2');
      });

      test('Updating the value to a static value', async () => {
        firstChild.set('content', 'new_content_value');
        expect(firstChild.get('content')).toBe('new_content_value');
        expect(secondChild.get('content')).toBe('new_content_value');

        firstRecord.set('user', 'wrong_value');
        expect(firstChild.get('content')).toBe('new_content_value');
        expect(secondChild.get('content')).toBe('new_content_value');
      });

      test('Updating the value to a diffirent collection variable', async () => {
        firstChild.set('content', {
          // @ts-ignore
          type: CollectionVariableType,
          variable_type: CollectionStateVariableType.current_item,
          path: 'age',
        });
        expect(firstChild.get('content')).toBe('12');
        expect(secondChild.get('content')).toBe('14');

        firstRecord.set('age', 'new_value_12');
        secondRecord.set('age', 'new_value_14');

        firstRecord.set('user', 'wrong_value');
        secondRecord.set('user', 'wrong_value');

        expect(firstChild.get('content')).toBe('new_value_12');
        expect(secondChild.get('content')).toBe('new_value_14');
      });

      test('Updating the value to a diffirent dynamic variable', async () => {
        firstChild.set('content', {
          // @ts-ignore
          type: DataVariableType,
          path: 'my_data_source_id.user2.user',
        });
        expect(firstChild.get('content')).toBe('user2');
        expect(secondChild.get('content')).toBe('user2');
        expect(thirdChild.get('content')).toBe('user2');

        secondRecord.set('user', 'new_value');
        expect(firstChild.get('content')).toBe('new_value');
        expect(secondChild.get('content')).toBe('new_value');
        expect(thirdChild.get('content')).toBe('new_value');
      });
    });

    test('Attributes', () => {
      const cmp = wrapper.components({
        type: CollectionComponentType,
        collectionDefinition: {
          block: {
            type: 'default',
            attributes: {
              custom_attribute: {
                type: CollectionVariableType,
                variable_type: CollectionStateVariableType.current_item,
                path: 'user',
              },
            },
          },
          config: {
            dataSource: {
              type: DataVariableType,
              path: 'my_data_source_id',
            },
          },
        },
      })[0];

      const firstChild = cmp.components().at(0);
      const secondChild = cmp.components().at(1);

      expect(firstChild.getAttributes()['custom_attribute']).toBe('user1');

      expect(secondChild.getAttributes()['custom_attribute']).toBe('user2');
    });

    test('Traits', () => {
      const cmp = wrapper.components({
        type: CollectionComponentType,
        collectionDefinition: {
          block: {
            type: 'default',
            traits: [
              {
                name: 'attribute_trait',
                value: {
                  type: CollectionVariableType,
                  variable_type: CollectionStateVariableType.current_item,
                  path: 'user',
                },
              },
              {
                name: 'property_trait',
                changeProp: true,
                value: {
                  type: CollectionVariableType,
                  variable_type: CollectionStateVariableType.current_item,
                  path: 'user',
                },
              },
            ],
          },
          config: {
            dataSource: {
              type: DataVariableType,
              path: 'my_data_source_id',
            },
          },
        },
      })[0];

      expect(cmp.components()).toHaveLength(3);
      const firstChild = cmp.components().at(0);
      const secondChild = cmp.components().at(1);

      expect(firstChild.getAttributes()['attribute_trait']).toBe('user1');
      expect(firstChild.get('property_trait')).toBe('user1');

      expect(secondChild.getAttributes()['attribute_trait']).toBe('user2');
      expect(secondChild.get('property_trait')).toBe('user2');
    });
  });

  describe('Stringfication', () => {
    test('Collection with dynamic datasource', () => {
      const cmp = wrapper.components({
        type: CollectionComponentType,
        collectionDefinition: {
          collection_name: 'my_collection',
          block: {
            type: 'default',
            content: {
              type: CollectionVariableType,
              variable_type: CollectionStateVariableType.current_item,
              path: 'user',
            },
            attributes: {
              content: {
                type: CollectionVariableType,
                variable_type: CollectionStateVariableType.current_item,
                path: 'user',
              },
            },
            traits: [
              {
                name: 'attribute_trait',
                value: {
                  type: CollectionVariableType,
                  variable_type: CollectionStateVariableType.current_item,
                  path: 'user',
                },
              },
              {
                name: 'property_trait',
                changeProp: true,
                value: {
                  type: CollectionVariableType,
                  variable_type: CollectionStateVariableType.current_item,
                  path: 'user',
                },
              },
            ],
          },
          config: {
            start_index: 0,
            end_index: 1,
            dataSource: {
              type: DataVariableType,
              path: 'my_data_source_id',
            },
          },
        },
      })[0];

      const json = cmp.toJSON();
      expect(filterObjectForSnapshot(json)).toMatchSnapshot();
    });
  });

  describe('Configuration options', () => {
    test('Collection with start and end indexes', () => {
      const cmp = wrapper.components({
        type: CollectionComponentType,
        collectionDefinition: {
          block: {
            type: 'default',
            content: {
              type: CollectionVariableType,
              variable_type: CollectionStateVariableType.current_item,
              path: 'user',
            },
          },
          config: {
            start_index: 1,
            end_index: 2,
            dataSource: {
              type: DataVariableType,
              path: 'my_data_source_id',
            },
          },
        },
      })[0];

      expect(cmp.components()).toHaveLength(2);
      const firstChild = cmp.components().at(0);
      const secondChild = cmp.components().at(1);

      expect(firstChild.get('content')).toBe('user2');
      expect(secondChild.get('content')).toBe('user3');
    });
  });

  describe('Diffirent Collection variable types', () => {
    const stateVariableTests = [
      { variableType: CollectionStateVariableType.current_index, expectedValues: [0, 1, 2] },
      { variableType: CollectionStateVariableType.start_index, expectedValues: [0, 0, 0] },
      { variableType: CollectionStateVariableType.end_index, expectedValues: [2, 2, 2] },
      {
        variableType: CollectionStateVariableType.collection_name,
        expectedValues: ['my_collection', 'my_collection', 'my_collection'],
      },
      { variableType: CollectionStateVariableType.total_items, expectedValues: [3, 3, 3] },
      { variableType: CollectionStateVariableType.remaining_items, expectedValues: [2, 1, 0] },
    ];

    stateVariableTests.forEach(({ variableType, expectedValues }) => {
      test(`Variable type: ${variableType}`, () => {
        const cmp = wrapper.components({
          type: CollectionComponentType,
          collectionDefinition: {
            collection_name: 'my_collection',
            block: {
              type: 'default',
              content: {
                type: CollectionVariableType,
                variable_type: variableType,
              },
            },
            config: {
              dataSource: {
                type: DataVariableType,
                path: 'my_data_source_id',
              },
            },
          },
        })[0];

        const children = cmp.components();
        expect(children).toHaveLength(3);

        children.each((child, index) => {
          expect(child.get('content')).toBe(expectedValues[index]);
        });
      });
    });
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
