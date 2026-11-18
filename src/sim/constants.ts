import type { Side } from '../data/units';

export const TICKS_PER_SEC = 30;
export const LANE_MIN = 0;
export const LANE_MAX = 2100;
export const BASE_HALF_WIDTH = 60;

export const BASE_X: Record<Side, number> = { player: 100, enemy: 2000 };
export const SPAWN_X: Record<Side, number> = { player: 160, enemy: 1940 };
export const BASE_MAX_HP: Record<Side, number> = { player: 2000, enemy: 3500 };
