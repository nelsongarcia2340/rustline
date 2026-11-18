import type { SpriteDef } from './defs';
import { BASE_ENEMY_BODY, BASE_ENEMY_OUTLINE, BASE_PLAYER_BODY, BASE_PLAYER_OUTLINE } from './palette';

const BASE_SIZE = 48;

function buildBaseGrid(): string[] {
  const margin = 4;
  const grid: string[][] = Array.from({ length: BASE_SIZE }, () => Array(BASE_SIZE).fill('.'));

  for (let y = margin; y < BASE_SIZE - margin; y++) {
    for (let x = margin; x < BASE_SIZE - margin; x++) {
      grid[y][x] = 'b';
    }
  }
  for (let y = margin; y < BASE_SIZE - margin; y++) {
    grid[y][margin] = 'o';
    grid[y][BASE_SIZE - margin - 1] = 'o';
  }
  for (let x = margin; x < BASE_SIZE - margin; x++) {
    grid[margin][x] = 'o';
    grid[BASE_SIZE - margin - 1][x] = 'o';
  }

  return grid.map((row) => row.join(''));
}

function buildBaseSprite(body: string, outline: string): SpriteDef {
  const frame = buildBaseGrid();
  return {
    palette: { b: body, o: outline },
    frames: { walk1: frame, walk2: frame, attack: frame },
  };
}

export const BASE_SPRITES: Record<string, SpriteDef> = {
  'base-player': buildBaseSprite(BASE_PLAYER_BODY, BASE_PLAYER_OUTLINE),
  'base-enemy': buildBaseSprite(BASE_ENEMY_BODY, BASE_ENEMY_OUTLINE),
};
