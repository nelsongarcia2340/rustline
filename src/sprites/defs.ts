import { BASE_ENEMY, BASE_PLAYER } from './base';
import type { SpriteDef } from './types';
import { ENEMY_SPRITES } from './units-enemy';
import { PLAYER_SPRITES } from './units-player';

export type { SpriteDef, SpriteFrameName } from './types';

/** Every sprite, keyed by unit id plus `base-player` / `base-enemy`. All face right. */
export const SPRITES: Record<string, SpriteDef> = {
  ...PLAYER_SPRITES,
  ...ENEMY_SPRITES,
  'base-player': BASE_PLAYER,
  'base-enemy': BASE_ENEMY,
};
