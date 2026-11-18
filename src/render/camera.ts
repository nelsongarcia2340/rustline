import { LANE_MAX, LANE_MIN } from '../sim/constants';
import type { World } from '../sim/world';

export interface Camera {
  x: number;
}

export const VIEWPORT_WIDTH = 960;
export const CAMERA_MIN = LANE_MIN;
export const CAMERA_MAX = LANE_MAX - VIEWPORT_WIDTH;
const EASE = 0.1;

export function updateCamera(cam: Camera, world: World, manual: boolean): void {
  if (manual) {
    return;
  }

  const playerUnits = world.units.filter((u) => u.def.side === 'player');
  if (playerUnits.length === 0) {
    return;
  }

  const frontMostX = Math.max(...playerUnits.map((u) => u.x));
  const target = Math.max(CAMERA_MIN, Math.min(CAMERA_MAX, frontMostX - VIEWPORT_WIDTH / 2));

  cam.x += (target - cam.x) * EASE;
  cam.x = Math.max(CAMERA_MIN, Math.min(CAMERA_MAX, cam.x));
}
