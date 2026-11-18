import { describe, expect, it } from 'vitest';
import { ENEMY_ROSTER, PLAYER_ROSTER } from '../../src/data/units';
import { SPRITES } from '../../src/sprites/defs';
import { hexToRgb } from '../../src/sprites/palette';

const FRAME_KEYS = ['walk1', 'walk2', 'attack'] as const;
const PLAYER_IDS = [...PLAYER_ROSTER.map((d) => d.id), 'base-player'];
const ENEMY_IDS = [...ENEMY_ROSTER.map((d) => d.id), 'base-enemy'];
const UNIT_IDS = [...PLAYER_ROSTER, ...ENEMY_ROSTER].map((d) => d.id);

describe('sprite data', () => {
  it('has a sprite for every unit and both bases', () => {
    for (const id of [...UNIT_IDS, 'base-player', 'base-enemy']) {
      expect(SPRITES[id], id).toBeDefined();
    }
  });

  it('keeps all three frames rectangular and the same size', () => {
    for (const [id, def] of Object.entries(SPRITES)) {
      const height = def.frames.walk1.length;
      const width = def.frames.walk1[0].length;
      expect(height, id).toBeGreaterThan(0);
      expect(width, id).toBeGreaterThan(0);
      for (const key of FRAME_KEYS) {
        const rows = def.frames[key];
        expect(rows.length, `${id}.${key} rows`).toBe(height);
        for (const [y, row] of rows.entries()) {
          expect(row.length, `${id}.${key} row ${y}`).toBe(width);
        }
      }
    }
  });

  it('only uses characters that exist in the sprite palette', () => {
    for (const [id, def] of Object.entries(SPRITES)) {
      for (const key of FRAME_KEYS) {
        for (const row of def.frames[key]) {
          for (const ch of row) {
            if (ch === '.') continue;
            expect(def.palette[ch], `${id}.${key} char "${ch}"`).toBeDefined();
          }
        }
      }
    }
  });

  it('reads cool for the player side and warm for the enemy side', () => {
    for (const id of PLAYER_IDS) {
      const [r, , b] = hexToRgb(SPRITES[id].palette.body);
      expect(b, `${id} body blue > red`).toBeGreaterThan(r);
    }
    for (const id of ENEMY_IDS) {
      const [r, , b] = hexToRgb(SPRITES[id].palette.body);
      expect(r, `${id} body red > blue`).toBeGreaterThan(b);
    }
  });

  it('animates: unit frames differ from each other', () => {
    for (const id of UNIT_IDS) {
      const { walk1, walk2, attack } = SPRITES[id].frames;
      expect(walk2, `${id} walk2`).not.toEqual(walk1);
      expect(attack, `${id} attack`).not.toEqual(walk1);
    }
  });
});

describe('hexToRgb', () => {
  it('parses #rrggbb', () => {
    expect(hexToRgb('#ff8000')).toEqual([255, 128, 0]);
  });
});
