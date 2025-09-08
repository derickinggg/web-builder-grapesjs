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
    let flatPagesDataSource: DataSource;
    let wrapper: ComponentWrapper;

    const pagesData = [
      { id: 'page1', page: 'page1', title: 'Title1', content: 'content 1' },
      { id: 'page2', page: 'page2', title: 'Title2', content: 'content 2' },
      { id: 'page3', page: 'page3', title: 'Title3', content: 'content 3' },
    ];

    beforeEach(() => {
      ({ em, dsm } = setupTestEditor());
      wrapper = em.getWrapper() as ComponentWrapper;

      pagesDataSource = dsm.add({
        id: 'pagesDataSource',
        records: [{ id: 'pages', data: pagesData }],
      });

      flatPagesDataSource = dsm.add({
        id: 'flatPagesDataSource',
        records: pagesData,
      });
    });

    afterEach(() => {
      em.destroy();
    });

    const createDataResolver = (path: string): DataVariableProps => ({
      type: DataVariableType,
      path,
    });

    const setResolver = (path: string) => {
      wrapper.setDataResolver(createDataResolver(path));
      wrapper.resolverCurrentItem = 0;
    };

    const appendChildWithTitle = () =>
      wrapper.append({
        type: 'default',
        title: {
          type: 'data-variable',
          collectionId: keyRootData,
          path: 'title',
        },
      })[0];

    test('sets dataResolver and updates wrapper.page/head collectionsStateMap', () => {
      setResolver('pagesDataSource.pages.data');
      const stateMap = wrapper.collectionsStateMap;

      expect(stateMap).toHaveProperty(keyRootData);
      expect(wrapper.head.collectionsStateMap).toEqual(stateMap);
    });

    test('children reflect resolved value from dataResolver', () => {
      setResolver('pagesDataSource.pages.data');
      const child = appendChildWithTitle();

      expect(child.collectionsStateMap).toEqual(wrapper.collectionsStateMap);
      expect(child.collectionsStateMap).toEqual({
        [keyRootData]: pagesData[0],
      });
      expect(child.get('title')).toBe(pagesData[0].title);
    });

    test('updating record propagates to children2', () => {
      setResolver('flatPagesDataSource');
      const child = appendChildWithTitle();

      expect(child.collectionsStateMap).toEqual(wrapper.collectionsStateMap);
      expect(child.collectionsStateMap).toEqual({
        [keyRootData]: pagesData[0],
      });
      expect(child.get('title')).toBe(pagesData[0].title);
    });
  });
});
