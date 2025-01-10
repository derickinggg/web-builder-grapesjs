import { Component, DataRecord, DataSource, DataSourceManager, Editor } from '../../../../../src';
import { DataVariableType } from '../../../../../src/data_sources/model/DataVariable';
import {
  CollectionComponentType,
  CollectionVariableType,
} from '../../../../../src/data_sources/model/collection_component/constants';
import { CollectionStateVariableType } from '../../../../../src/data_sources/model/collection_component/types';
import EditorModel from '../../../../../src/editor/model/Editor';
import { filterObjectForSnapshot, setupTestEditor } from '../../../../common';
import { getSymbolMain, getSymbolTop } from '../../../../../src/dom_components/model/SymbolUtils';
import { ProjectData } from '../../../../../src/storage_manager';

describe('Collection component', () => {
  let em: EditorModel;
  let editor: Editor;
  let dsm: DataSourceManager;
  let dataSource: DataSource;
  let wrapper: Component;
  let firstRecord: DataRecord;
  let secondRecord: DataRecord;

  beforeEach(() => {
    ({ em, editor, dsm } = setupTestEditor());
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
      let firstGrandchild!: Component;
      let secondChild!: Component;
      let secondGrandchild!: Component;
      let thirdChild!: Component;

      beforeEach(() => {
        cmp = wrapper.components({
          type: CollectionComponentType,
          collectionDefinition: {
            block: {
              type: 'default',
              components: [
                {
                  type: 'default',
                  content: {
                    type: CollectionVariableType,
                    variable_type: CollectionStateVariableType.current_item,
                    path: 'user',
                  },
                },
              ],
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
        firstGrandchild = firstChild.components().at(0);
        secondChild = cmp.components().at(1);
        secondGrandchild = secondChild.components().at(0);
        thirdChild = cmp.components().at(2);
      });

      test('Evaluating to static value', () => {
        expect(firstChild.get('content')).toBe('user1');
        expect(firstChild.get('custom_property')).toBe('user1');
        expect(firstGrandchild.get('content')).toBe('user1');

        expect(secondChild.get('content')).toBe('user2');
        expect(secondChild.get('custom_property')).toBe('user2');
        expect(secondGrandchild.get('content')).toBe('user2');
      });

      test('Watching Records', async () => {
        firstRecord.set('user', 'new_user1_value');
        expect(firstChild.get('content')).toBe('new_user1_value');
        expect(firstChild.get('custom_property')).toBe('new_user1_value');
        expect(firstGrandchild.get('content')).toBe('new_user1_value');

        expect(secondChild.get('content')).toBe('user2');
        expect(secondChild.get('custom_property')).toBe('user2');
        expect(secondGrandchild.get('content')).toBe('user2');
      });

      test('Updating the value to a static value', async () => {
        firstChild.set('content', 'new_content_value');
        expect(firstChild.get('content')).toBe('new_content_value');
        expect(secondChild.get('content')).toBe('new_content_value');

        firstRecord.set('user', 'wrong_value');
        expect(firstChild.get('content')).toBe('new_content_value');
        expect(secondChild.get('content')).toBe('new_content_value');

        firstGrandchild.set('content', 'new_content_value');
        expect(firstGrandchild.get('content')).toBe('new_content_value');
        expect(secondGrandchild.get('content')).toBe('new_content_value');

        firstRecord.set('user', 'wrong_value');
        expect(firstGrandchild.get('content')).toBe('new_content_value');
        expect(secondGrandchild.get('content')).toBe('new_content_value');
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

        firstGrandchild.set('content', {
          // @ts-ignore
          type: CollectionVariableType,
          variable_type: CollectionStateVariableType.current_item,
          path: 'age',
        });
        expect(firstGrandchild.get('content')).toBe('new_value_12');
        expect(secondGrandchild.get('content')).toBe('new_value_14');

        firstRecord.set('age', 'most_new_value_12');
        secondRecord.set('age', 'most_new_value_14');

        expect(firstGrandchild.get('content')).toBe('most_new_value_12');
        expect(secondGrandchild.get('content')).toBe('most_new_value_14');
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

        firstGrandchild.set('content', {
          // @ts-ignore
          type: DataVariableType,
          path: 'my_data_source_id.user2.user',
        });
        expect(firstGrandchild.get('content')).toBe('new_value');
        expect(secondGrandchild.get('content')).toBe('new_value');

        secondRecord.set('user', 'most_new_value');

        expect(firstGrandchild.get('content')).toBe('most_new_value');
        expect(secondGrandchild.get('content')).toBe('most_new_value');
      });
    });

    describe('Attributes', () => {
      let cmp: Component;
      let firstChild!: Component;
      let firstGrandchild!: Component;
      let secondChild!: Component;
      let secondGrandchild!: Component;
      let thirdChild!: Component;

      beforeEach(() => {
        cmp = wrapper.components({
          type: CollectionComponentType,
          collectionDefinition: {
            block: {
              type: 'default',
              components: [
                {
                  type: 'default',
                  attributes: {
                    content: {
                      type: CollectionVariableType,
                      variable_type: CollectionStateVariableType.current_item,
                      path: 'user',
                    },
                  },
                },
              ],
              attributes: {
                content: {
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

        firstChild = cmp.components().at(0);
        firstGrandchild = firstChild.components().at(0);
        secondChild = cmp.components().at(1);
        secondGrandchild = secondChild.components().at(0);
        thirdChild = cmp.components().at(2);
      });

      test('Evaluating to static value', () => {
        expect(firstChild.getAttributes()['content']).toBe('user1');
        expect(firstGrandchild.getAttributes()['content']).toBe('user1');

        expect(secondChild.getAttributes()['content']).toBe('user2');
        expect(secondGrandchild.getAttributes()['content']).toBe('user2');
      });

      test('Watching Records', async () => {
        firstRecord.set('user', 'new_user1_value');
        expect(firstChild.getAttributes()['content']).toBe('new_user1_value');
        expect(firstGrandchild.getAttributes()['content']).toBe('new_user1_value');

        expect(secondChild.getAttributes()['content']).toBe('user2');
        expect(secondGrandchild.getAttributes()['content']).toBe('user2');
      });

      test('Updating the value to a static value', async () => {
        firstChild.setAttributes({ content: 'new_content_value' });
        expect(firstChild.getAttributes()['content']).toBe('new_content_value');
        expect(secondChild.getAttributes()['content']).toBe('new_content_value');

        firstRecord.set('user', 'wrong_value');
        expect(firstChild.getAttributes()['content']).toBe('new_content_value');
        expect(secondChild.getAttributes()['content']).toBe('new_content_value');

        firstGrandchild.setAttributes({ content: 'new_content_value' });
        expect(firstGrandchild.getAttributes()['content']).toBe('new_content_value');
        expect(secondGrandchild.getAttributes()['content']).toBe('new_content_value');

        firstRecord.set('user', 'wrong_value');
        expect(firstGrandchild.getAttributes()['content']).toBe('new_content_value');
        expect(secondGrandchild.getAttributes()['content']).toBe('new_content_value');
      });

      test('Updating the value to a diffirent collection variable', async () => {
        firstChild.setAttributes({
          content: {
            // @ts-ignore
            type: CollectionVariableType,
            variable_type: CollectionStateVariableType.current_item,
            path: 'age',
          },
        });
        expect(firstChild.getAttributes()['content']).toBe('12');
        expect(secondChild.getAttributes()['content']).toBe('14');

        firstRecord.set('age', 'new_value_12');
        secondRecord.set('age', 'new_value_14');

        firstRecord.set('user', 'wrong_value');
        secondRecord.set('user', 'wrong_value');

        expect(firstChild.getAttributes()['content']).toBe('new_value_12');
        expect(secondChild.getAttributes()['content']).toBe('new_value_14');

        firstGrandchild.setAttributes({
          content: {
            // @ts-ignore
            type: CollectionVariableType,
            variable_type: CollectionStateVariableType.current_item,
            path: 'age',
          },
        });
        expect(firstGrandchild.getAttributes()['content']).toBe('new_value_12');
        expect(secondGrandchild.getAttributes()['content']).toBe('new_value_14');

        firstRecord.set('age', 'most_new_value_12');
        secondRecord.set('age', 'most_new_value_14');

        expect(firstGrandchild.getAttributes()['content']).toBe('most_new_value_12');
        expect(secondGrandchild.getAttributes()['content']).toBe('most_new_value_14');
      });

      test('Updating the value to a diffirent dynamic variable', async () => {
        firstChild.setAttributes({
          content: {
            // @ts-ignore
            type: DataVariableType,
            path: 'my_data_source_id.user2.user',
          },
        });
        expect(firstChild.getAttributes()['content']).toBe('user2');
        expect(secondChild.getAttributes()['content']).toBe('user2');
        expect(thirdChild.getAttributes()['content']).toBe('user2');

        secondRecord.set('user', 'new_value');
        expect(firstChild.getAttributes()['content']).toBe('new_value');
        expect(secondChild.getAttributes()['content']).toBe('new_value');
        expect(thirdChild.getAttributes()['content']).toBe('new_value');

        firstGrandchild.setAttributes({
          content: {
            // @ts-ignore
            type: DataVariableType,
            path: 'my_data_source_id.user2.user',
          },
        });
        expect(firstGrandchild.getAttributes()['content']).toBe('new_value');
        expect(secondGrandchild.getAttributes()['content']).toBe('new_value');

        secondRecord.set('user', 'most_new_value');

        expect(firstGrandchild.getAttributes()['content']).toBe('most_new_value');
        expect(secondGrandchild.getAttributes()['content']).toBe('most_new_value');
      });
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

      firstRecord.set('user', 'new_user1_value');
      expect(firstChild.getAttributes()['attribute_trait']).toBe('new_user1_value');
      expect(firstChild.get('property_trait')).toBe('new_user1_value');

      expect(secondChild.getAttributes()['attribute_trait']).toBe('user2');
      expect(secondChild.get('property_trait')).toBe('user2');
    });
  });

  describe('Serialization', () => {
    let cmp: Component;

    beforeEach(() => {
      const cmpDefinition = {
        type: 'default',
        content: {
          type: CollectionVariableType,
          variable_type: CollectionStateVariableType.current_item,
          path: 'user',
        },
        custom_prop: {
          type: CollectionVariableType,
          variable_type: CollectionStateVariableType.current_index,
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
      };

      const collectionComponentDefinition = {
        type: CollectionComponentType,
        collectionDefinition: {
          collection_name: 'my_collection',
          block: {
            ...cmpDefinition,
            components: [cmpDefinition, cmpDefinition],
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
      };

      cmp = wrapper.components(collectionComponentDefinition)[0];
    });

    test('Serializion with Collection Variables to JSON', () => {
      expect(filterObjectForSnapshot(cmp.toJSON())).toMatchSnapshot(`Collection with no grandchildren`);

      const firstChild = cmp.components().at(0);
      const newChildDefinition = {
        type: 'default',
        content: {
          type: CollectionVariableType,
          variable_type: CollectionStateVariableType.current_index,
          path: 'user',
        },
      };
      firstChild.components().at(0).components(newChildDefinition);
      expect(filterObjectForSnapshot(cmp.toJSON())).toMatchSnapshot(`Collection with grandchildren`);
    });

    test('Saving', () => {
      const projectData = editor.getProjectData();
      const page = projectData.pages[0];
      const frame = page.frames[0];
      const component = frame.component.components[0];

      expect(filterObjectForSnapshot(component)).toMatchSnapshot(`Collection with no grandchildren`);

      const firstChild = cmp.components().at(0);
      const newChildDefinition = {
        type: 'default',
        content: {
          type: CollectionVariableType,
          variable_type: CollectionStateVariableType.current_index,
          path: 'user',
        },
      };
      firstChild.components().at(0).components(newChildDefinition);
      expect(filterObjectForSnapshot(cmp.toJSON())).toMatchSnapshot(`Collection with grandchildren`);
    });

    test('Loading', () => {
      const componentProjectData: ProjectData = {
        assets: [],
        pages: [
          {
            frames: [
              {
                component: {
                  components: [
                    {
                      collectionDefinition: {
                        block: {
                          attributes: {
                            attribute_trait: {
                              path: 'user',
                              type: CollectionVariableType,
                              variable_type: CollectionStateVariableType.current_item,
                            },
                            content: {
                              path: 'user',
                              type: CollectionVariableType,
                              variable_type: CollectionStateVariableType.current_item,
                            },
                          },
                          components: [
                            {
                              attributes: {
                                attribute_trait: {
                                  path: 'user',
                                  type: CollectionVariableType,
                                  variable_type: CollectionStateVariableType.current_item,
                                },
                                content: {
                                  path: 'user',
                                  type: CollectionVariableType,
                                  variable_type: CollectionStateVariableType.current_item,
                                },
                              },
                              content: {
                                path: 'user',
                                type: CollectionVariableType,
                                variable_type: CollectionStateVariableType.current_item,
                              },
                              custom_prop: {
                                path: 'user',
                                type: CollectionVariableType,
                                variable_type: 'current_index',
                              },
                              property_trait: {
                                path: 'user',
                                type: CollectionVariableType,
                                variable_type: CollectionStateVariableType.current_item,
                              },
                              type: 'default',
                            },
                            {
                              attributes: {
                                attribute_trait: {
                                  path: 'user',
                                  type: CollectionVariableType,
                                  variable_type: CollectionStateVariableType.current_item,
                                },
                                content: {
                                  path: 'user',
                                  type: CollectionVariableType,
                                  variable_type: CollectionStateVariableType.current_item,
                                },
                              },
                              content: {
                                path: 'user',
                                type: CollectionVariableType,
                                variable_type: CollectionStateVariableType.current_item,
                              },
                              custom_prop: {
                                path: 'user',
                                type: CollectionVariableType,
                                variable_type: 'current_index',
                              },
                              property_trait: {
                                path: 'user',
                                type: CollectionVariableType,
                                variable_type: CollectionStateVariableType.current_item,
                              },
                              type: 'default',
                            },
                          ],
                          content: {
                            path: 'user',
                            type: CollectionVariableType,
                            variable_type: CollectionStateVariableType.current_item,
                          },
                          custom_prop: {
                            path: 'user',
                            type: CollectionVariableType,
                            variable_type: 'current_index',
                          },
                          property_trait: {
                            path: 'user',
                            type: CollectionVariableType,
                            variable_type: CollectionStateVariableType.current_item,
                          },
                          type: 'default',
                        },
                        collection_name: 'my_collection',
                        config: {
                          dataSource: {
                            path: 'my_data_source_id',
                            type: DataVariableType,
                          },
                          end_index: 1,
                          start_index: 0,
                        },
                      },
                      type: 'collection-component',
                    },
                  ],
                  docEl: {
                    tagName: 'html',
                  },
                  head: {
                    type: 'head',
                  },
                  stylable: [
                    'background',
                    'background-color',
                    'background-image',
                    'background-repeat',
                    'background-attachment',
                    'background-position',
                    'background-size',
                  ],
                  type: 'wrapper',
                },
                id: 'frameid',
              },
            ],
            id: 'pageid',
            type: 'main',
          },
        ],
        styles: [],
        symbols: [],
        dataSources: [dataSource],
      };
      editor.loadProjectData(componentProjectData);

      const components = editor.getComponents();
      const component = components.models[0];
      const firstChild = component.components().at(0);
      const firstGrandchild = firstChild.components().at(0);
      const secondChild = component.components().at(1);
      const secondGrandchild = secondChild.components().at(0);

      expect(firstChild.get('content')).toBe('user1');
      expect(firstChild.getAttributes()['content']).toBe('user1');
      expect(firstGrandchild.get('content')).toBe('user1');
      expect(firstGrandchild.getAttributes()['content']).toBe('user1');

      expect(secondChild.get('content')).toBe('user2');
      expect(secondChild.getAttributes()['content']).toBe('user2');
      expect(secondGrandchild.get('content')).toBe('user2');
      expect(secondGrandchild.getAttributes()['content']).toBe('user2');

      firstRecord.set('user', 'new_user1_value');
      expect(firstChild.get('content')).toBe('new_user1_value');
      expect(firstChild.getAttributes()['content']).toBe('new_user1_value');
      expect(firstGrandchild.get('content')).toBe('new_user1_value');
      expect(firstGrandchild.getAttributes()['content']).toBe('new_user1_value');

      expect(secondChild.get('content')).toBe('user2');
      expect(secondChild.getAttributes()['content']).toBe('user2');
      expect(secondGrandchild.get('content')).toBe('user2');
      expect(secondGrandchild.getAttributes()['content']).toBe('user2');
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
              attributes: {
                custom_attribute: {
                  type: CollectionVariableType,
                  variable_type: variableType,
                },
              },
              traits: [
                {
                  name: 'attribute_trait',
                  value: {
                    type: CollectionVariableType,
                    variable_type: variableType,
                  },
                },
                {
                  name: 'property_trait',
                  changeProp: true,
                  value: {
                    type: CollectionVariableType,
                    variable_type: variableType,
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

        const children = cmp.components();
        expect(children).toHaveLength(3);

        children.each((child, index) => {
          expect(child.get('content')).toBe(expectedValues[index]);
          expect(child.get('property_trait')).toBe(expectedValues[index]);
          expect(child.getAttributes()['custom_attribute']).toBe(expectedValues[index]);
          expect(child.getAttributes()['attribute_trait']).toBe(expectedValues[index]);
        });
      });
    });
  });
});
