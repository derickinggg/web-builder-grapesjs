import { DataSourceManager, DataSource, DataRecord } from '../../../../src';
import { DataVariableProps, DataVariableType } from '../../../../src/data_sources/model/DataVariable';
import Component from '../../../../src/dom_components/model/Component';
import ComponentHead from '../../../../src/dom_components/model/ComponentHead';
import ComponentWrapper from '../../../../src/dom_components/model/ComponentWrapper';
import { keyRootData } from '../../../../src/dom_components/constants';
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
    let pagesDataSource: DataSource;
    let wrapper: ComponentWrapper;
    let firstRecord: DataRecord;

    const firstPageData = { id: 'page1', title: 'Title1' };
    const pagesData = [firstPageData, { id: 'page2', title: 'Title2' }, { id: 'page3', title: 'Title3' }];
    const objectData = {
      page1: { title: 'page1' },
      page2: { title: 'page2' },
    };

    beforeEach(() => {
      ({ em, dsm } = setupTestEditor());
      wrapper = em.getWrapper() as ComponentWrapper;

      pagesDataSource = dsm.add({
        id: 'pagesDataSource',
        records: [
          { id: 'pages', data: pagesData },
          {
            id: 'objectData',
            data: objectData,
          },
        ],
      });

      firstRecord = em.DataSources.get('pagesDataSource').getRecord('pages')!;
    });

    afterEach(() => {
      em.destroy();
    });

    const createDataResolver = (path: string): DataVariableProps => ({
      type: DataVariableType,
      path,
    });

    const appendChildWithTitle = (path: string = 'title') =>
      wrapper.append({
        type: 'default',
        title: {
          type: 'data-variable',
          collectionId: keyRootData,
          path,
        },
      })[0];

    test('sets dataResolver and updates wrapper.page/head collectionsStateMap', () => {
      wrapper.setDataResolver(createDataResolver('pagesDataSource.pages.data'));
      wrapper.resolverCurrentItem = 0;
      const stateMap = wrapper.collectionsStateMap;

      expect(stateMap).toHaveProperty(keyRootData);
      expect(wrapper.head.collectionsStateMap).toEqual(stateMap);
      expect(wrapper.head.collectionsStateMap).toEqual({ [keyRootData]: firstPageData });
    });

    test('children reflect resolved value from dataResolver', () => {
      wrapper.setDataResolver(createDataResolver('pagesDataSource.pages.data'));
      wrapper.resolverCurrentItem = 0;
      const child = appendChildWithTitle();
      expect(child.collectionsStateMap).toEqual({ [keyRootData]: firstPageData });

      expect(child.get('title')).toBe(pagesData[0].title);

      firstRecord.set('data', [{ id: 'page1', title: 'new_title' }]);
      expect(child.get('title')).toBe('new_title');
    });

    test('children update collectionStateMap on wrapper.setDataResolver', () => {
      const child = appendChildWithTitle();
      wrapper.setDataResolver(createDataResolver('pagesDataSource.pages.data'));
      wrapper.resolverCurrentItem = 0;

      expect(child.collectionsStateMap).toEqual({ [keyRootData]: firstPageData });
      expect(child.get('title')).toBe(pagesData[0].title);

      firstRecord.set('data', [{ id: 'page1', title: 'new_title' }]);
      expect(child.get('title')).toBe('new_title');
    });

    test('wrapper should handle objects as collection state ', () => {
      wrapper.setDataResolver(createDataResolver('pagesDataSource.objectData.data'));
      wrapper.resolverCurrentItem = 'page1';
      const child = appendChildWithTitle('title');

      expect(child.collectionsStateMap).toEqual({ [keyRootData]: objectData.page1 });
      expect(child.get('title')).toBe(objectData.page1.title);
    });
  });
});
