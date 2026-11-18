import { BASE_X, LANE_MAX } from '../sim/constants';
import type { World } from '../sim/world';

/** Logical canvas width in world units (1 world unit = 1 canvas pixel). */
export const VIEW_WIDTH = 960;
export const MAX_CAMERA_X = LANE_MAX - VIEW_WIDTH;

/** The front-most player unit is kept this fraction of the view width from the left edge. */
const LEAD_FRACTION = 0.35;
const EASE = 0.1;
const SNAP_DISTANCE = 0.5;

export interface Camera {
  /** Left edge of the view, in world units. */
  x: number;
}

export function createCamera(): Camera {
  return { x: 0 };
}

function clampX(x: number): number {
  return Math.min(MAX_CAMERA_X, Math.max(0, x));
}

/** Ease toward the front-most player unit (or the player base). Does nothing while dragging. */
export function updateCamera(cam: Camera, world: World, dragging: boolean): void {
  if (dragging) return;
  let front = -Infinity;
  for (const u of world.units) {
    if (u.def.side === 'player' && u.x > front) front = u.x;
  }
  if (front === -Infinity) front = BASE_X.player;
  const target = clampX(front - VIEW_WIDTH * LEAD_FRACTION);
  const diff = target - cam.x;
  cam.x = clampX(Math.abs(diff) < SNAP_DISTANCE ? target : cam.x + diff * EASE);
}

/** Shift the view by `dxWorld` world units (used by drag input), clamped to the lane. */
export function panCamera(cam: Camera, dxWorld: number): void {
  cam.x = clampX(cam.x + dxWorld);
}
