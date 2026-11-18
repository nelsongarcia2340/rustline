import type { World } from '../sim/world';

export interface Camera {
  x: number;
}

const VIEWPORT_WIDTH = 960;
const CAMERA_MIN = 0;
const CAMERA_MAX = 3000 - VIEWPORT_WIDTH;
const EASE = 0.1;

export function updateCamera(cam: Camera, world: World, dragging: boolean): void {
  if (dragging) {
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
