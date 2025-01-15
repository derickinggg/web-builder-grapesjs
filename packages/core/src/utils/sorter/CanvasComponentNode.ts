import { BaseComponentNode } from './BaseComponentNode';

export default class CanvasComponentNode extends BaseComponentNode {
  protected _dropAreaConfig = {
    ratio: 0.8,
    minUndroppableDimension: 1, // In px
    maxUndroppableDimension: 15, // In px
  };
  /**
   * Check if a source node can be moved to a specified index within this component.
   * @param {BaseComponentNode} source - The source node to move.
   * @param {number} index - The display index to move the source to.
   * @returns {boolean} - True if the move is allowed, false otherwise.
   */
  canMove(source: BaseComponentNode, index: number): boolean {
    return this.model.em.Components.canMove(this.model, source.model, this.getRealIndex(index)).result;
  }
  /**
   * Get the associated view of this component.
   * @returns The view associated with the component, or undefined if none.
   */
  get view() {
    return this.model.getView?.();
  }

  /**
   * Get the associated element of this component.
   * @returns The Element associated with the component, or undefined if none.
   */
  get element() {
    return this.model.getEl?.();
  }
}
