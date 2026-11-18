import { ENEMY_ROSTER, PLAYER_ROSTER } from '../data/units';
import { BASE_SPRITES } from './base';
import { ENEMY_BODY, ENEMY_OUTLINE, ENEMY_WEAPON, PLAYER_BODY, PLAYER_OUTLINE, PLAYER_WEAPON } from './palette';

export interface SpriteDef {
  palette: Record<string, string>;
  frames: {
    walk1: string[];
    walk2: string[];
    attack: string[];
  };
}

function buildGrid(size: number, legOffset: 0 | 1, withWeapon: boolean): string[] {
  const margin = Math.floor(size * 0.2);
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill('.'));

  for (let y = margin; y < size - margin; y++) {
    for (let x = margin; x < size - margin; x++) {
      grid[y][x] = 'b';
    }
  }
  for (let y = margin; y < size - margin; y++) {
    grid[y][margin] = 'o';
    grid[y][size - margin - 1] = 'o';
  }
  for (let x = margin; x < size - margin; x++) {
    grid[margin][x] = 'o';
    grid[size - margin - 1][x] = 'o';
  }

  const legRow1 = size - margin;
  const legRow2 = size - margin + 1;
  const legX1 = margin + 2 + legOffset;
  const legX2 = size - margin - 3 - legOffset;
  if (legRow1 < size) {
    grid[legRow1][legX1] = 'o';
    grid[legRow1][legX2] = 'o';
  }
  if (legRow2 < size) {
    grid[legRow2][legX1] = 'o';
    grid[legRow2][legX2] = 'o';
  }

  if (withWeapon) {
    const wy = Math.floor(size / 2);
    if (size - margin < size) grid[wy][size - margin] = 'w';
    if (size - margin + 1 < size) grid[wy][size - margin + 1] = 'w';
  }

  return grid.map((row) => row.join(''));
}

function buildSprite(size: number, body: string, outline: string, weapon: string): SpriteDef {
  return {
    palette: { b: body, o: outline, w: weapon },
    frames: {
      walk1: buildGrid(size, 0, false),
      walk2: buildGrid(size, 1, false),
      attack: buildGrid(size, 0, true),
    },
  };
}

const UNIT_SPRITES: Record<string, SpriteDef> = {};

for (const def of PLAYER_ROSTER) {
  const size = def.id === 'titan' ? 32 : 24;
  UNIT_SPRITES[def.id] = buildSprite(size, PLAYER_BODY, PLAYER_OUTLINE, PLAYER_WEAPON);
}

for (const def of ENEMY_ROSTER) {
  const size = def.id === 'overseer' ? 32 : 24;
  UNIT_SPRITES[def.id] = buildSprite(size, ENEMY_BODY, ENEMY_OUTLINE, ENEMY_WEAPON);
}

export const SPRITES: Record<string, SpriteDef> = { ...UNIT_SPRITES, ...BASE_SPRITES };
