import { panCamera, VIEW_WIDTH, type Camera } from '../render/camera';
import { DEPLOY_KEYS } from './hud';

export interface InputState {
  /** True while a pointer is dragging the lane; the main loop passes this to updateCamera. */
  dragging: boolean;
}

export interface Input {
  state: InputState;
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
  const ac = new AbortController();
  const opts = { signal: ac.signal };
  let pointerId: number | null = null;
  let lastX = 0;

  canvas.addEventListener(
    'pointerdown',
    (e) => {
      if (pointerId !== null) return;
      e.preventDefault();
      pointerId = e.pointerId;
      lastX = e.clientX;
      state.dragging = true;
      canvas.setPointerCapture(e.pointerId);
    },
    opts,
  );

  canvas.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerId !== pointerId) return;
      const width = canvas.getBoundingClientRect().width;
      if (width <= 0) return;
      const dxPixels = e.clientX - lastX;
      lastX = e.clientX;
      // Dragging right moves the world right, so the view moves left.
      panCamera(getCamera(), -dxPixels * (VIEW_WIDTH / width));
    },
    opts,
  );

  const endDrag = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    state.dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener('pointerup', endDrag, opts);
  canvas.addEventListener('pointercancel', endDrag, opts);

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const index = DEPLOY_KEYS.indexOf(e.key);
      if (index >= 0) onDeployIndex(index);
    },
    opts,
  );

  return { state, dispose: () => ac.abort() };
}
