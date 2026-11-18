export interface DragTracker {
  /** True while a pointer owns the drag. */
  readonly active: boolean;
  /** Begin a drag with `pointerId`. Returns false (changing nothing) if a drag is already active. */
  start(pointerId: number): boolean;
  /**
   * Pan to apply for a pointer movement of `dxPixels`: the view moves opposite to the pointer,
   * scaled by `unitsPerPixel`. Returns 0 if `pointerId` does not own the active drag.
   */
  move(pointerId: number, dxPixels: number, unitsPerPixel?: number): number;
  /** End the drag if `pointerId` owns it (or whichever is active when omitted). Returns whether a drag ended. */
  end(pointerId?: number): boolean;
  /** Unconditionally drop any active drag. */
  reset(): void;
}

/** Pure drag state machine; input.ts wires it to DOM events. */
export function createDragTracker(): DragTracker {
  let owner: number | null = null;

  return {
    get active() {
      return owner !== null;
    },
    start(pointerId) {
      if (owner !== null) return false;
      owner = pointerId;
      return true;
    },
    move(pointerId, dxPixels, unitsPerPixel = 1) {
      if (owner === null || pointerId !== owner) return 0;
      return -dxPixels * unitsPerPixel;
    },
    end(pointerId) {
      if (owner === null) return false;
      if (pointerId !== undefined && pointerId !== owner) return false;
      owner = null;
      return true;
    },
    reset() {
      owner = null;
    },
  };
}
