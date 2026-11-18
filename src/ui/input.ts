import { panCamera, VIEW_WIDTH, type Camera } from '../render/camera';
import { createDragTracker } from './drag';

/** Number keys that deploy the five roster units, in roster order. */
export const DEPLOY_KEYS = ['1', '2', '3', '4', '5'];

export interface InputState {
  /** True while a pointer is dragging the lane; the main loop passes this to updateCamera. */
  dragging: boolean;
}

export interface Input {
  state: InputState;
  /** End any drag in progress (used on restart). */
  reset(): void;
  /** Remove every listener this module added. */
  dispose(): void;
}

export interface InputOptions {
  canvas: HTMLCanvasElement;
  /** Looked up on every drag so a restart can swap the camera object. */
  getCamera: () => Camera;
  /** Called with a roster index (0-4) when a deploy key is pressed. */
  onDeployIndex: (index: number) => void;
}

/** Drag-to-pan on the canvas and keys 1-5 for the deploy bar. Buttons wire their own pointerdown in the HUD. */
export function createInput({ canvas, getCamera, onDeployIndex }: InputOptions): Input {
  const state: InputState = { dragging: false };
  const drag = createDragTracker();
  const ac = new AbortController();
  const opts = { signal: ac.signal };
  let capturedId: number | null = null;
  /** Pointer that owns the drag, and its last seen x (other pointers must not disturb it). */
  let dragId: number | null = null;
  let lastX = 0;

  const releaseCapture = (): void => {
    if (capturedId === null) return;
    const id = capturedId;
    capturedId = null;
    try {
      if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    } catch {
      // The pointer is already gone; nothing to release.
    }
  };

  /** The one place a drag ends (pointerup, cancel, lost capture, blur, restart). */
  const endDrag = (pointerId?: number): void => {
    if (!drag.end(pointerId)) return;
    dragId = null;
    state.dragging = false;
    releaseCapture();
  };

  canvas.addEventListener(
    'pointerdown',
    (e) => {
      // Mouse: primary button only. Touch and pen report button 0 on contact.
      if (e.button !== 0) return;
      if (!drag.start(e.pointerId)) return;
      e.preventDefault();
      dragId = e.pointerId;
      lastX = e.clientX;
      state.dragging = true;
      try {
        canvas.setPointerCapture(e.pointerId);
        capturedId = e.pointerId;
      } catch {
        // Capture can fail for a pointer that just vanished; the drag still works without it.
      }
    },
    opts,
  );

  canvas.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerId !== dragId) return;
      const width = canvas.getBoundingClientRect().width;
      if (width <= 0) return;
      const dxPixels = e.clientX - lastX;
      lastX = e.clientX;
      const pan = drag.move(e.pointerId, dxPixels, VIEW_WIDTH / width);
      if (pan !== 0) panCamera(getCamera(), pan);
    },
    opts,
  );

  canvas.addEventListener('pointerup', (e) => endDrag(e.pointerId), opts);
  canvas.addEventListener('pointercancel', (e) => endDrag(e.pointerId), opts);
  canvas.addEventListener('lostpointercapture', (e) => endDrag(e.pointerId), opts);
  window.addEventListener('blur', () => endDrag(), opts);

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const index = DEPLOY_KEYS.indexOf(e.key);
      if (index >= 0) onDeployIndex(index);
    },
    opts,
  );

  return {
    state,
    reset: () => {
      drag.reset();
      dragId = null;
      state.dragging = false;
      releaseCapture();
    },
    dispose: () => ac.abort(),
  };
}
