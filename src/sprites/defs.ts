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

type Role = 'grunt' | 'fast' | 'ranged' | 'tank' | 'heavy';

const ROLE_BY_ID: Record<string, Role> = {
  scrapper: 'grunt',
  rustbot: 'grunt',
  'bolt-gunner': 'ranged',
  'turret-walker': 'ranged',
  bulwark: 'tank',
  'siege-tank': 'tank',
  sprinter: 'fast',
  drone: 'fast',
  titan: 'heavy',
  overseer: 'heavy',
};

function buildGrid(size: number, role: Role, legOffset: 0 | 1, withWeapon: boolean): string[] {
  let marginX = Math.floor(size * 0.2);
  let marginTop = Math.floor(size * 0.2);
  const marginBottom = Math.floor(size * 0.2);

  if (role === 'fast') {
    marginX = Math.floor(size * 0.15);
    marginTop = Math.floor(size * 0.4);
  } else if (role === 'tank') {
    marginX = Math.floor(size * 0.1);
  }

  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill('.'));
  const top = marginTop;
  const bottom = size - marginBottom;
  const left = marginX;
  const right = size - marginX;

  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      grid[y][x] = 'b';
    }
  }
  for (let y = top; y < bottom; y++) {
    grid[y][left] = 'o';
    grid[y][right - 1] = 'o';
  }
  for (let x = left; x < right; x++) {
    grid[top][x] = 'o';
    grid[bottom - 1][x] = 'o';
  }

  if (role === 'tank') {
    if (left - 1 >= 0) for (let y = top; y < bottom; y++) grid[y][left - 1] = 'o';
    if (right < size) for (let y = top; y < bottom; y++) grid[y][right] = 'o';
    if (top - 1 >= 0) for (let x = left; x < right; x++) grid[top - 1][x] = 'o';
    if (bottom < size) for (let x = left; x < right; x++) grid[bottom][x] = 'o';
  }

  if (role === 'fast') {
    grid[top][right - 1] = '.';
    if (right - 2 >= left) grid[top][right - 2] = '.';
  }

  const legRow1 = bottom;
  const legRow2 = bottom + 1;
  const legX1 = left + 2 + legOffset;
  const legX2 = right - 3 - legOffset;
  if (legRow1 < size && legX2 < size && legX1 >= 0) {
    grid[legRow1][legX1] = 'o';
    grid[legRow1][legX2] = 'o';
  }
  if (legRow2 < size && legX2 < size && legX1 >= 0) {
    grid[legRow2][legX1] = 'o';
    grid[legRow2][legX2] = 'o';
  }

  if (role === 'ranged') {
    const wy = Math.floor(size / 2);
    const barrelLen = withWeapon ? 3 : 2;
    for (let i = 0; i < barrelLen; i++) {
      const wx = right + i;
      if (wx < size) grid[wy][wx] = 'w';
    }
  } else if (role === 'heavy') {
    const coreSize = Math.max(2, Math.floor(size * 0.12));
    const center = Math.floor(size / 2);
    for (let y = center - Math.floor(coreSize / 2); y < center + Math.ceil(coreSize / 2); y++) {
      for (let x = center - Math.floor(coreSize / 2); x < center + Math.ceil(coreSize / 2); x++) {
        if (y >= 0 && y < size && x >= 0 && x < size) grid[y][x] = 'w';
      }
    }
  } else if (withWeapon) {
    const wy = Math.floor(size / 2);
    if (right < size) grid[wy][right] = 'w';
    if (right + 1 < size) grid[wy][right + 1] = 'w';
  }

  return grid.map((row) => row.join(''));
}

function buildSprite(size: number, role: Role, body: string, outline: string, weapon: string): SpriteDef {
  return {
    palette: { b: body, o: outline, w: weapon },
    frames: {
      walk1: buildGrid(size, role, 0, false),
      walk2: buildGrid(size, role, 1, false),
      attack: buildGrid(size, role, 0, true),
    },
  };
}

const UNIT_SPRITES: Record<string, SpriteDef> = {};

for (const def of PLAYER_ROSTER) {
  const size = def.id === 'titan' ? 32 : 24;
  UNIT_SPRITES[def.id] = buildSprite(size, ROLE_BY_ID[def.id], PLAYER_BODY, PLAYER_OUTLINE, PLAYER_WEAPON);
}

for (const def of ENEMY_ROSTER) {
  const size = def.id === 'overseer' ? 32 : 24;
  UNIT_SPRITES[def.id] = buildSprite(size, ROLE_BY_ID[def.id], ENEMY_BODY, ENEMY_OUTLINE, ENEMY_WEAPON);
}

export const SPRITES: Record<string, SpriteDef> = { ...UNIT_SPRITES, ...BASE_SPRITES };
