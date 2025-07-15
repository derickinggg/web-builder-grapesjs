import { Position } from '../../common';
import Component from '../../dom_components/model/Component';
import { ComponentsEvents } from '../../dom_components/types';
import ComponentView from '../../dom_components/view/ComponentView';
import StyleableModel from '../../domain_abstract/model/StyleableModel';
import { getUnitFromValue } from '../../utils/mixins';
import Resizer, { RectDim, ResizerOptions } from '../../utils/Resizer';
import { CommandObject } from './CommandAbstract';

export interface ComponentResizeOptions extends ResizerOptions {
  component: Component;
  componentView?: ComponentView;
  el?: HTMLElement;
  afterStart?: () => void;
  afterEnd?: () => void;
  /**
   * @deprecated
   */
  options?: ResizerOptions;
}

export interface ComponentResizeModelProperty {
  value: string;
  property: string;
  number: number;
  unit: string;
}

export interface ComponentResizeEventProps {
  component: Component;
  event: PointerEvent;
  el: HTMLElement;
  rect: RectDim;
}

export interface ComponentResizeEventStartProps extends ComponentResizeEventProps {
  model: StyleableModel;
  modelWidth: ComponentResizeModelProperty;
  modelHeight: ComponentResizeModelProperty;
}

export interface ComponentResizeEventMoveProps extends ComponentResizeEventProps {
  delta: Position;
  pointer: Position;
}

export interface ComponentResizeEventEndProps extends ComponentResizeEventProps {
  moved: boolean;
}

export interface ComponentResizeEventUpdateProps extends Omit<ComponentResizeEventProps, 'event'> {
  partial: boolean;
  delta: Position;
  pointer: Position;
}

export default {
  run(editor, _, options: ComponentResizeOptions) {
    const { Canvas, Utils, em } = editor;
    const canvasView = Canvas.getCanvasView();
    const pfx = em.config.stylePrefix || '';
    const resizeClass = `${pfx}resizing`;
    const {
      onStart = () => {},
      onMove = () => {},
      onEnd = () => {},
      updateTarget = () => {},
      el: elOpts,
      componentView,
      component,
      ...resizableOpts
    } = options;
    const el = elOpts || componentView?.el || component.getEl()!;
    const resizeEventOpts = { component, el };
    let modelToStyle: StyleableModel;

    const toggleBodyClass = (method: string, e: any, opts: any) => {
      const docs = opts.docs;
      docs &&
        docs.forEach((doc: Document) => {
          const body = doc.body;
          const cls = body.className || '';
          body.className = (method == 'add' ? `${cls} ${resizeClass}` : cls.replace(resizeClass, '')).trim();
        });
    };

    const resizeOptions: ResizerOptions = {
      appendTo: Canvas.getResizerEl(),
      prefix: editor.getConfig().stylePrefix,
      posFetcher: canvasView.getElementPos.bind(canvasView),
      mousePosFetcher: Canvas.getMouseRelativePos.bind(Canvas),
      onStart(ev, opts) {
        onStart(ev, opts);
        const { el, config, resizer } = opts;
        const { keyHeight, keyWidth, currentUnit, keepAutoHeight, keepAutoWidth } = config;
        toggleBodyClass('add', ev, opts);
        modelToStyle = em.Styles.getModelToStyle(component);
        const computedStyle = getComputedStyle(el);
        const modelStyle = modelToStyle.getStyle();
        const rectStart = { ...resizer.startDim! };

        let currentWidth = modelStyle[keyWidth!] as string;
        config.autoWidth = keepAutoWidth && currentWidth === 'auto';
        if (isNaN(parseFloat(currentWidth))) {
          currentWidth = computedStyle[keyWidth as any];
        }

        let currentHeight = modelStyle[keyHeight!] as string;
        config.autoHeight = keepAutoHeight && currentHeight === 'auto';
        if (isNaN(parseFloat(currentHeight))) {
          currentHeight = computedStyle[keyHeight as any];
        }

        const valueWidth = parseFloat(currentWidth);
        const valueHeight = parseFloat(currentHeight);
        const unitWidth = getUnitFromValue(currentWidth);
        const unitHeight = getUnitFromValue(currentHeight);

        if (currentUnit) {
          config.unitWidth = unitWidth;
          config.unitHeight = unitHeight;
        }

        const eventProps: ComponentResizeEventStartProps = {
          ...resizeEventOpts,
          event: ev,
          rect: rectStart,
          model: modelToStyle,
          modelWidth: {
            value: currentWidth,
            property: keyWidth!,
            number: valueWidth,
            unit: unitWidth,
          },
          modelHeight: {
            value: currentHeight,
            property: keyHeight!,
            number: valueHeight,
            unit: unitHeight,
          },
        };
        console.log('resize onStart', eventProps);
        editor.trigger(ComponentsEvents.resizeStart, eventProps);
        editor.trigger(ComponentsEvents.resize, { ...eventProps, type: 'start' });
        options.afterStart?.();
      },

      // Update all positioned elements (eg. component toolbar)
      onMove(event, opts) {
        onMove(event, opts);
        const { resizer } = opts;
        const eventProps: ComponentResizeEventMoveProps = {
          ...resizeEventOpts,
          event,
          delta: resizer.delta!,
          pointer: resizer.currentPos!,
          rect: resizer.rectDim!,
        };
        editor.trigger(ComponentsEvents.resizeStart, eventProps);
        editor.trigger(ComponentsEvents.resize, { ...eventProps, type: 'move' });
      },

      onEnd(event, opts) {
        onEnd(event, opts);
        toggleBodyClass('remove', event, opts);
        const { resizer } = opts;
        const eventProps: ComponentResizeEventEndProps = {
          ...resizeEventOpts,
          event,
          rect: resizer.rectDim!,
          moved: resizer.moved,
        };
        console.log('resize onEnd', eventProps);
        editor.trigger(ComponentsEvents.resizeEnd, eventProps);
        editor.trigger(ComponentsEvents.resize, { ...resizeEventOpts, type: 'end' });
        options.afterEnd?.();
      },

      updateTarget(el, rect, options) {
        updateTarget(el, rect, options);
        if (!modelToStyle) {
          return;
        }

        const { store, selectedHandler, config, resizer } = options;
        const { keyHeight, keyWidth, autoHeight, autoWidth, unitWidth, unitHeight } = config;
        const onlyHeight = ['tc', 'bc'].indexOf(selectedHandler!) >= 0;
        const onlyWidth = ['cl', 'cr'].indexOf(selectedHandler!) >= 0;
        const partial = !store;
        const style: any = {};

        if (!onlyHeight) {
          const bodyw = Canvas.getBody()?.offsetWidth || 0;
          const width = rect.w < bodyw ? rect.w : bodyw;
          style[keyWidth!] = autoWidth ? 'auto' : `${width}${unitWidth}`;
        }

        if (!onlyWidth) {
          style[keyHeight!] = autoHeight ? 'auto' : `${rect.h}${unitHeight}`;
        }

        if (em.getDragMode(component)) {
          style.top = `${rect.t}${unitHeight}`;
          style.left = `${rect.l}${unitWidth}`;
        }

        const finalStyle = {
          ...style,
          __p: partial,
        };
        modelToStyle.addStyle(finalStyle, { avoidStore: partial });
        em.Styles.__emitCmpStyleUpdate(finalStyle, { components: em.getSelected() });

        const eventProps: ComponentResizeEventUpdateProps = {
          ...resizeEventOpts,
          rect,
          partial,
          delta: resizer.delta!,
          pointer: resizer.currentPos!,
        };
        console.log('resize onUpdate', eventProps);
        editor.trigger(ComponentsEvents.resizeEnd, eventProps);
      },
      ...resizableOpts,
      ...options.options,
    };

    let { canvasResizer } = this;

    // Create the resizer for the canvas if not yet created
    if (!canvasResizer) {
      this.canvasResizer = new Utils.Resizer(resizeOptions);
      canvasResizer = this.canvasResizer;
    }

    canvasResizer.setOptions(resizeOptions, true);
    canvasResizer.blur();
    canvasResizer.focus(el);
    return canvasResizer;
  },

  stop() {
    this.canvasResizer?.blur();
  },
} as CommandObject<ComponentResizeOptions, { canvasResizer?: Resizer }>;
