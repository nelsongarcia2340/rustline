import type { Side } from '../data/units';

export const TICKS_PER_SEC = 30;

export const LANE_MIN = 0;
export const LANE_MAX = 3000;

export const BASE_X: Record<Side, number> = { player: 100, enemy: 2900 };
/** Half the width of a base's hit area, in world units. */
export const BASE_HALF_WIDTH = 60;

export const SPAWN_X: Record<Side, number> = { player: 160, enemy: 2840 };

export const BASE_MAX_HP: Record<Side, number> = { player: 2000, enemy: 3500 };
