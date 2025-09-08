import { DataSourceManager, DataSource, DataRecord } from '../../../../src';
import { DataVariableProps, DataVariableType } from '../../../../src/data_sources/model/DataVariable';
import Component from '../../../../src/dom_components/model/Component';
import ComponentHead from '../../../../src/dom_components/model/ComponentHead';
import ComponentWrapper, { keyRootData } from '../../../../src/dom_components/model/ComponentWrapper';
import Editor from '../../../../src/editor';
import EditorModel from '../../../../src/editor/model/Editor';
import { setupTestEditor } from '../../../common';

describe('ComponentWrapper', () => {
  let em: Editor;

  beforeEach(() => {
    em = new Editor({ avoidDefaults: true });
    em.Pages.onLoad();
  });

  describe('.clone', () => {
    test('clones the component and returns a new instance for head and document element', () => {
      const originalComponent = em.Pages.getSelected()?.getMainComponent();
      const clonedComponent = originalComponent?.clone();
      em.Pages.add(
        {
          id: 'PAGE_ID',
          clonedComponent,
        },
        {
          select: true,
        },
      );
      const newPageComponent = em.Pages.get('PAGE_ID')?.getMainComponent();

      expect(clonedComponent?.head).toBeInstanceOf(ComponentHead);
      expect(clonedComponent?.head.cid).not.toEqual(originalComponent?.head.cid);

      expect(clonedComponent?.docEl).toBeInstanceOf(Component);
      expect(clonedComponent?.docEl.cid).not.toEqual(originalComponent?.docEl.cid);
      expect(newPageComponent?.head.cid).not.toEqual(originalComponent?.head.cid);
    });
  });

  describe('ComponentWrapper with DataResolver', () => {
    let em: EditorModel;
    let dsm: DataSourceManager;
    let dataSource: DataSource;
    let wrapper: ComponentWrapper;
    let firstRecord: DataRecord;

    const records = [
      {
        id: 'pages',
        data: [
          { id: 'page1', page: 'page1', title: 'Title1', content: 'content 1' },
          { id: 'page2', page: 'page2', title: 'Title2', content: 'content 2' },
          { id: 'page3', page: 'page3', title: 'Title3', content: 'content 3' },
        ],
      },
    ];

    beforeEach(() => {
      ({ em, dsm } = setupTestEditor());
      wrapper = em.getWrapper() as ComponentWrapper;

      dataSource = dsm.add({
        id: 'my_data_source_id',
        records,
      });

      firstRecord = dataSource.getRecord('page1')!;
    });

    afterEach(() => {
      em.destroy();
    });

    function createDataResolver(path: string): DataVariableProps {
      return {
        type: DataVariableType,
        path,
      };
    }

    test('sets dataResolver and updates wrapper.page/head collectionsStateMap', () => {
      wrapper.setDataResolver(createDataResolver('my_data_source_id.pages.data'));
      const stateMap = wrapper.collectionsStateMap;

      expect(stateMap).toHaveProperty(keyRootData);
      expect(wrapper.page?.collectionsStateMap).toEqual(stateMap);
      expect(wrapper.head.collectionsStateMap).toEqual(stateMap);
    });

    test('children reflect resolved value from dataResolver', () => {
      wrapper.setDataResolver(createDataResolver('my_data_source_id.pages.data'));
      const child = wrapper.append({
        type: 'default',
      })[0];
      expect(child.collectionsStateMap).toEqual(wrapper.collectionsStateMap);
    });

    test('updating record propagates to children', () => {
      wrapper.setDataResolver(createDataResolver('my_data_source_id.pages.data'));
      const child = wrapper.append({
        type: 'default',
      })[0];

      expect(child.collectionsStateMap).toEqual(wrapper.collectionsStateMap);
    });
  });
});
