import type { Camera } from '../render/camera';

export interface DragState {
  dragging: boolean;
}

const CAMERA_MIN = 0;
const CAMERA_MAX = 3000 - 960;

export function attachDragPan(canvas: HTMLCanvasElement, cam: Camera, dragState: DragState): void {
  let lastX = 0;
  let active = false;

  function toCanvasScale(clientDeltaX: number): number {
    const rect = canvas.getBoundingClientRect();
    return clientDeltaX * (canvas.width / rect.width);
  }

  function start(clientX: number): void {
    active = true;
    dragState.dragging = true;
    lastX = clientX;
  }

  function move(clientX: number): void {
    if (!active) {
      return;
    }
    cam.x -= toCanvasScale(clientX - lastX);
    cam.x = Math.max(CAMERA_MIN, Math.min(CAMERA_MAX, cam.x));
    lastX = clientX;
  }

  function end(): void {
    active = false;
    dragState.dragging = false;
  }

  canvas.addEventListener('mousedown', (e) => start(e.clientX));
  window.addEventListener('mousemove', (e) => move(e.clientX));
  window.addEventListener('mouseup', end);

  canvas.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches[0]) start(e.touches[0].clientX);
    },
    { passive: true },
  );
  canvas.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches[0]) move(e.touches[0].clientX);
    },
    { passive: true },
  );
  canvas.addEventListener('touchend', end);
}
