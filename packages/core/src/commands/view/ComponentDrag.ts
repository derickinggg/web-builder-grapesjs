import { keys, bindAll, each, isUndefined, debounce } from 'underscore';
import Dragger, { DraggerOptions } from '../../utils/Dragger';
import type { CommandObject } from './CommandAbstract';
import type Editor from '../../editor';
import type Component from '../../dom_components/model/Component';
import type EditorModel from '../../editor/model/Editor';
import { getComponentModel, getComponentView } from '../../utils/mixins';
import type ComponentView from '../../dom_components/view/ComponentView';

const evName = 'dmode';

export default {
  run(editor, _sender, opts = {}) {
    bindAll(
      this,
      'setPosition',
      'onStart',
      'onDrag',
      'onEnd',
      'getPosition',
      'getGuidesStatic',
      'renderGuide',
      'getGuidesTarget',
    );

    const config = {
      doc: opts.target?.getEl()?.ownerDocument,
      onStart: this.onStart,
      onEnd: this.onEnd,
      onDrag: this.onDrag,
      getPosition: this.getPosition,
      setPosition: this.setPosition,
      guidesStatic: () => this.guidesStatic ?? [],
      guidesTarget: () => this.guidesTarget ?? [],
      ...(opts.dragger ?? {}),
    };
    this.setupGuides();
    this.opts = opts;
    this.editor = editor;
    this.em = editor.getModel();
    this.target = opts.target;
    this.isTran = opts.mode == 'translate';
    this.guidesContainer = this.getGuidesContainer();
    this.guidesTarget = this.getGuidesTarget();
    this.guidesStatic = this.getGuidesStatic();

    let drg = this.dragger;

    if (!drg) {
      drg = new Dragger(config);
      this.dragger = drg;
    } else {
      drg.setOptions(config);
    }

    opts.event && drg.start(opts.event);
    // TODO: check this
    opts.addStyle?.({ component: this.target, styles: {}, partial: false });
    this.toggleDrag(true);
    this.em.trigger(`${evName}:start`, this.getEventOpts());

    return drg;
  },

  getEventOpts() {
    return {
      mode: this.opts?.mode,
      target: this.target,
      guidesTarget: this.guidesTarget,
      guidesStatic: this.guidesStatic,
    };
  },

  stop() {
    this.toggleDrag();
  },

  setupGuides() {
    (this.guides ?? []).forEach((item) => {
      const { guide } = item;
      guide?.parentNode?.removeChild(guide);
    });
    this.guides = [];
  },

  getGuidesContainer() {
    let { guidesEl } = this;

    if (!guidesEl) {
      const { editor, em, opts } = this;
      const pfx = editor!.getConfig().stylePrefix ?? '';
      const elInfoX = document.createElement('div');
      const elInfoY = document.createElement('div');
      const guideContent = `<div class="${pfx}guide-info__line ${pfx}danger-bg">
        <div class="${pfx}guide-info__content ${pfx}danger-color"></div>
      </div>`;
      guidesEl = document.createElement('div');
      guidesEl.className = `${pfx}guides`;
      elInfoX.className = `${pfx}guide-info ${pfx}guide-info__x`;
      elInfoY.className = `${pfx}guide-info ${pfx}guide-info__y`;
      elInfoX.innerHTML = guideContent;
      elInfoY.innerHTML = guideContent;
      guidesEl.appendChild(elInfoX);
      guidesEl.appendChild(elInfoY);
      editor!.Canvas.getGlobalToolsEl()?.appendChild(guidesEl);
      this.guidesEl = guidesEl;
      this.elGuideInfoX = elInfoX;
      this.elGuideInfoY = elInfoY;
      this.elGuideInfoContentX = elInfoX.querySelector(`.${pfx}guide-info__content`) ?? undefined;
      this.elGuideInfoContentY = elInfoY.querySelector(`.${pfx}guide-info__content`) ?? undefined;

      em.on(
        'canvas:update frame:scroll',
        debounce(() => {
          this.updateGuides();
          opts?.debug && this.guides?.forEach((item) => this.renderGuide(item));
        }, 200),
      );
    }

    return guidesEl;
  },

  getGuidesStatic() {
    let result: Guide[] = [];
    const el = this.target?.getEl();
    const parentNode = el?.parentElement;
    if (!parentNode) return [];
    each(
      parentNode.children,
      (item) => (result = result.concat(el !== item ? this.getElementGuides(item as HTMLElement) : [])),
    );

    return result.concat(this.getElementGuides(parentNode));
  },

  getGuidesTarget() {
    const targetEl = this.target?.getEl();
    if (!targetEl) return [];
    return this.getElementGuides(targetEl);
  },

  updateGuides(guides) {
    let lastEl: HTMLElement;
    let lastPos: ComponentOrigRect;
    const guidesToUpdate = guides ?? this.guides ?? [];
    guidesToUpdate.forEach((item) => {
      const { origin } = item;
      const pos = lastEl === origin ? lastPos : this.getElementPos(origin);
      lastEl = origin;
      lastPos = pos;
      // @ts-expect-error // TODO: this type
      each(this.getGuidePosUpdate(item, pos), (val, key) => (item[key] = val));
      item.originRect = pos;
    });
  },

  getGuidePosUpdate(item, rect) {
    const result: { x?: number; y?: number } = {};
    const { top, height, left, width } = rect;

    switch (item.type) {
      case 't':
        result.y = top;
        break;
      case 'b':
        result.y = top + height;
        break;
      case 'l':
        result.x = left;
        break;
      case 'r':
        result.x = left + width;
        break;
      case 'x':
        result.x = left + width / 2;
        break;
      case 'y':
        result.y = top + height / 2;
        break;
    }

    return result;
  },

  renderGuide(item) {
    if (this.opts?.skipGuidesRender) return;
    const el = item.guide ?? document.createElement('div');
    const un = 'px';
    const guideSize = item.active ? 2 : 1;

    el.style.cssText = `position: absolute; background-color: ${item.active ? 'green' : 'red'};`;

    if (!el.children.length) {
      const numEl = document.createElement('div');
      numEl.style.cssText = 'position: absolute; color: red; padding: 5px; top: 0; left: 0;';
      el.appendChild(numEl);
    }

    if (item.y) {
      el.style.width = '100%';
      el.style.height = `${guideSize}${un}`;
      el.style.top = `${item.y}${un}`;
      el.style.left = '0';
    } else {
      el.style.width = `${guideSize}${un}`;
      el.style.height = '100%';
      el.style.left = `${item.x}${un}`;
      el.style.top = `0${un}`;
    }

    !item.guide && this.guidesContainer?.appendChild(el);
    return el;
  },

  getElementPos(el) {
    return this.editor!.Canvas.getElementPos(el, { noScroll: 1 });
  },

  getElementGuides(el) {
    const { opts } = this;
    const origin = el;
    const originRect = this.getElementPos(el);
    const component = getComponentModel(el);
    const componentView = getComponentView(el);

    const { top, height, left, width } = originRect;
    const guidePoints: { type: string; x?: number; y?: number }[] = [
      { type: 't', y: top }, // Top
      { type: 'b', y: top + height }, // Bottom
      { type: 'l', x: left }, // Left
      { type: 'r', x: left + width }, // Right
      { type: 'x', x: left + width / 2 }, // Mid x
      { type: 'y', y: top + height / 2 }, // Mid y
    ];

    const guides = guidePoints.map((guidePoint) => {
      const guide = opts?.debug ? this.renderGuide(guidePoint) : undefined;
      // INFO: origin, originRect, and guide are repeated to don't introduce breaking changes
      return {
        ...guidePoint,
        component,
        componentView,
        componentEl: origin,
        origin,
        componentElRect: originRect,
        originRect,
        guideEl: guide,
        guide,
      };
    }) as Guide[];

    guides.forEach((guidePoint) => this.guides?.push(guidePoint));

    return guides;
  },

  getTranslate(transform, axis = 'x') {
    let result = 0;
    (transform || '').split(' ').forEach((item) => {
      const itemStr = item.trim();
      const fn = `translate${axis.toUpperCase()}(`;
      if (itemStr.indexOf(fn) === 0) result = parseFloat(itemStr.replace(fn, ''));
    });
    return result;
  },

  setTranslate(transform, axis, value) {
    const fn = `translate${axis.toUpperCase()}(`;
    const val = `${fn}${value})`;
    let result = (transform || '')
      .split(' ')
      .map((item) => {
        const itemStr = item.trim();
        if (itemStr.indexOf(fn) === 0) item = val;
        return item;
      })
      .join(' ');
    if (result.indexOf(fn) < 0) result += ` ${val}`;

    return result;
  },

  getPosition() {
    const { target, isTran } = this;
    const targetStyle = target?.getStyle();

    const transform = targetStyle?.transform as string | undefined;
    const left = targetStyle?.left as string | undefined;
    const top = targetStyle?.top as string | undefined;

    let x = 0;
    let y = 0;

    if (isTran && transform) {
      x = this.getTranslate(transform);
      y = this.getTranslate(transform, 'y');
    } else {
      x = parseFloat(left ?? '0');
      y = parseFloat(top ?? '0');
    }

    return { x, y };
  },

  setPosition({ x, y, end, position, width, height }) {
    const { target, isTran, em } = this;
    const unit = 'px';
    const __p = !end; // Indicate if partial change
    const left = `${parseInt(`${x}`, 10)}${unit}`;
    const top = `${parseInt(`${y}`, 10)}${unit}`;
    let styleUp = {};

    if (isTran) {
      let transform = (target?.getStyle()?.transform ?? '') as string;
      transform = this.setTranslate(transform, 'x', left);
      transform = this.setTranslate(transform, 'y', top);
      styleUp = { transform, __p };
    } else {
      const adds: any = { position, width, height };
      const style: any = { left, top, __p };
      keys(adds).forEach((add) => {
        const prop = adds[add];
        if (prop) style[add] = prop;
      });
      styleUp = style;
    }

    target?.addStyle(styleUp, { avoidStore: !end });
    em?.Styles.__emitCmpStyleUpdate(styleUp, { components: em.getSelected() });
  },

  _getDragData() {
    const { target } = this;
    return {
      target,
      parent: target?.parent(),
      index: target?.index(),
    };
  },

  onStart(event) {
    const { target, editor, isTran, opts, guidesTarget } = this;
    const { Canvas } = editor!;
    const style = target?.getStyle();
    const position = 'absolute';
    const relPos = [position, 'relative'];
    opts?.onStart?.(this._getDragData());
    if (isTran) return;

    if (style?.position !== position) {
      const targetEl = target?.getEl();
      const offset = targetEl ? Canvas.offset(targetEl) : { left: 0, top: 0, width: 0, height: 0 };
      let { left, top, width, height } = offset;
      let parent = target?.parent();
      let parentRel;

      // Check for the relative parent
      do {
        const pStyle = parent?.getStyle();
        const position = pStyle?.position as string | undefined;
        if (position) {
          parentRel = relPos.indexOf(position) >= 0 ? parent : null;
        }
        parent = parent?.parent();
      } while (parent && !parentRel);

      // Center the target to the pointer position (used in Droppable for Blocks)
      if (opts?.center) {
        const { x, y } = Canvas.getMouseRelativeCanvas(event as MouseEvent);
        left = x;
        top = y;
      } else if (parentRel) {
        const parentRelEl = parentRel.getEl();
        const offsetP = parentRelEl ? Canvas.offset(parentRelEl) : { left: 0, top: 0, width: 0, height: 0 };
        left = left - offsetP.left;
        top = top - offsetP.top;
      }

      this.setPosition({
        x: left,
        y: top,
        width: `${width}px`,
        height: `${height}px`,
        position,
      });
    }
  },

  onDrag() {
    const { guidesTarget, opts } = this;
    const guidesTargetActive = guidesTarget?.filter((item) => item.active) ?? [];

    this.updateGuides(guidesTarget);
    opts?.debug && guidesTarget?.forEach((item) => this.renderGuide(item));
    opts?.guidesInfo && this.renderGuideInfo(guidesTargetActive);
    opts?.onDrag?.(this._getDragData());
  },

  onEnd(ev, _dragger, opt) {
    const { editor, opts, id } = this;
    opts?.onEnd?.(ev, opt, { event: ev, ...opt, ...this._getDragData() });
    editor!.stopCommand(`${id}`);
    this.hideGuidesInfo();

    this.em.trigger(`${evName}:end`, this.getEventOpts());
  },

  hideGuidesInfo() {
    ['X', 'Y'].forEach((item) => {
      const guide = this[`elGuideInfo${item}` as ElGuideInfoKey];
      if (guide) guide.style.display = 'none';
    });
  },

  renderGuideInfo(guides = []) {
    const matchedGuides = this.getMatchedGuides(guides);

    this.hideGuidesInfo();
    matchedGuides.forEach((matchedGuide) => {
      // TODO: improve this
      if (!this.opts?.skipGuidesRender) {
        this.renderSingleGuideInfo(matchedGuide);
      }

      this.em.trigger(`${evName}:active`, {
        ...this.getEventOpts(),
        ...matchedGuide,
      });
    });
  },

  renderSingleGuideInfo(matchedGuide: MatchedGuide) {
    const { posFirst, posSecond, size, sizeRaw, guide, elGuideInfo, elGuideInfoCnt } = matchedGuide;

    const axis = isUndefined(guide.x) ? 'y' : 'x';
    const isY = axis === 'y';
    const guideInfoStyle = elGuideInfo?.style;

    if (guideInfoStyle) {
      guideInfoStyle.display = '';
      guideInfoStyle[isY ? 'top' : 'left'] = `${posFirst}px`;
      guideInfoStyle[isY ? 'left' : 'top'] = `${posSecond}px`;
      guideInfoStyle[isY ? 'width' : 'height'] = `${size}px`;
    }

    if (elGuideInfoCnt) {
      elGuideInfoCnt.innerHTML = `${Math.round(sizeRaw)}px`;
    }
  },

  getMatchedGuides(guides = []): MatchedGuide[] {
    const { guidesStatic } = this;

    return guides
      .map((item) => {
        const { origin, x } = item;
        const rectOrigin = this.getElementPos(origin);
        const axis = isUndefined(x) ? 'y' : 'x';
        const isY = axis === 'y';
        const origEdge1 = rectOrigin[isY ? 'left' : 'top'];
        const origEdge2 = isY ? origEdge1 + rectOrigin.width : origEdge1 + rectOrigin.height;
        const elGuideInfo = this[`elGuideInfo${axis.toUpperCase()}` as ElGuideInfoKey];
        const elGuideInfoCnt = this[`elGuideInfoContent${axis.toUpperCase()}` as ElGuideInfoContentKey];

        // Find the nearest element
        const matched = guidesStatic
          ?.filter((stat) => stat.type === item.type)
          .map((stat) => {
            const { left, width, top, height } = stat.originRect;
            const statEdge1 = isY ? left : top;
            const statEdge2 = isY ? left + width : top + height;
            return {
              gap: statEdge2 < origEdge1 ? origEdge1 - statEdge2 : statEdge1 - origEdge2,
              guide: stat,
            };
          })
          .filter((item) => item.gap > 0)
          .sort((a, b) => a.gap - b.gap)
          .map((item) => item.guide)[0];

        if (matched) {
          const { left, width, top, height, rect } = matched.originRect;
          const isEdge1 = isY ? left < rectOrigin.left : top < rectOrigin.top;
          const statEdge2 = isY ? left + width : top + height;
          const posFirst = isY ? item.y : item.x;
          const posSecond = isEdge1 ? statEdge2 : origEdge2;
          const size = isEdge1 ? origEdge1 - statEdge2 : statEdge2 - origEdge2;
          const sizeRaw = isEdge1
            ? rectOrigin.rect[isY ? 'left' : 'top'] - rect[isY ? 'left' : 'top']
            : rect[isY ? 'left' : 'top'] - rectOrigin.rect[isY ? 'left' : 'top'];
          const sizePercent = (sizeRaw / (isY ? matched.originRect.height : matched.originRect.width)) * 100;

          return {
            guide: item,
            guidesStatic,
            matched,
            posFirst,
            posSecond,
            size,
            sizeRaw,
            sizePercent,
            elGuideInfo,
            elGuideInfoCnt,
          };
        }

        return null;
      })
      .filter(Boolean) as MatchedGuide[];
  },

  toggleDrag(enable) {
    const { ppfx, editor } = this;
    const methodCls = enable ? 'add' : 'remove';
    const classes = [`${ppfx}is__grabbing`];
    const { Canvas } = editor!;
    const body = Canvas.getBody();
    classes.forEach((cls) => body.classList[methodCls](cls));
    Canvas[enable ? 'startAutoscroll' : 'stopAutoscroll']();
  },
} as CommandObject<ComponentDragOpts, ComponentDragProps>;

interface ComponentDragProps {
  editor?: Editor;
  em?: EditorModel;
  guides?: Guide[];
  guidesContainer?: HTMLElement;
  guidesEl?: HTMLElement;
  guidesStatic?: Guide[];
  guidesTarget?: Guide[];
  isTran?: boolean;
  opts?: ComponentDragOpts;
  target?: Component;
  elGuideInfoX?: HTMLElement;
  elGuideInfoY?: HTMLElement;
  elGuideInfoContentX?: HTMLElement;
  elGuideInfoContentY?: HTMLElement;
  dragger?: Dragger;

  getEventOpts: () => { mode: string; target: Component; guidesTarget: Guide[]; guidesStatic: Guide[] };
  stop: () => void;
  setupGuides: () => void;
  getGuidesContainer: () => HTMLElement;
  getGuidesStatic: () => Guide[];
  getGuidesTarget: () => Guide[];
  updateGuides: (guides?: Guide[]) => void;
  getGuidePosUpdate: (item: Guide, rect: ComponentOrigRect) => { x?: number; y?: number };
  renderGuide: (item: { active?: boolean; guide?: HTMLElement; x?: number; y?: number }) => HTMLElement;
  getElementPos: (el: HTMLElement) => ComponentOrigRect;
  getElementGuides: (el: HTMLElement) => Guide[];
  getTranslate: (transform: string, axis?: string) => number;
  setTranslate: (transform: string, axis: string, value: string) => string;
  getPosition: DraggerOptions['getPosition'];
  setPosition: (data: any) => void; // TODO: fix any
  _getDragData: () => { target?: Component; parent?: Component; index?: number };
  onStart: DraggerOptions['onStart'];
  onDrag: DraggerOptions['onDrag'];
  onEnd: DraggerOptions['onEnd'];
  hideGuidesInfo: () => void;
  renderGuideInfo: (guides?: Guide[]) => void;
  renderSingleGuideInfo: (matchedGuide: MatchedGuide) => void;
  getMatchedGuides: (guides?: Guide[]) => MatchedGuide[];
  toggleDrag: (enable?: boolean) => void;
}

type ComponentDragOpts = {
  center?: number;
  debug?: boolean;
  dragger?: DraggerOptions;
  event?: Event;
  guidesInfo?: number;
  mode?: 'absolute' | 'translate';
  target?: Component;
  skipGuidesRender?: boolean;
  addStyle?: (data: { component?: Component; styles?: Record<string, unknown>; partial?: boolean }) => void;
  onDrag?: (data: any) => Editor; // TODO: fix any
  onEnd?: (ev: Event, opt: any, data: any) => void; // TODO: fix any
  onStart?: (data: any) => Editor; // TODO: fix any
};

type Guide = {
  type: string;
  y: number;
  x: number;
  component: Component;
  componentView: ComponentView;
  componentEl: HTMLElement;
  origin: HTMLElement; // @deprecated: use componentEl instead
  componentElRect: ComponentOrigRect;
  originRect: ComponentOrigRect; // @deprecated: use componentElRect instead
  guideEl?: HTMLElement;
  guide?: HTMLElement; // @deprecated: use guideEl instead
  active?: boolean; // TODO: is this used?
};

type MatchedGuide = {
  guide: Guide;
  guidesStatic: Guide[];
  matched: Guide;
  posFirst: number;
  posSecond: number;
  size: number;
  sizeRaw: number;
  sizePercent: number;
  elGuideInfo?: HTMLElement;
  elGuideInfoCnt?: HTMLElement;
};

type ComponentRect = { left: number; width: number; top: number; height: number };
type ComponentOrigRect = ComponentRect & { rect: ComponentRect };
type ElGuideInfoKey = 'elGuideInfoX' | 'elGuideInfoY';
type ElGuideInfoContentKey = 'elGuideInfoContentX' | 'elGuideInfoContentY';

// TODO: should we export this type? and if so, we should create 1 type for every event?
export type DragEventProps = {
  originComponent?: Component;
  originComponentView?: ComponentView;
  originGuides?: MatchedGuide[];
  matchedComponent?: Component;
  matchedComponentView?: ComponentView;
  matchedGuides?: MatchedGuide[];
};
