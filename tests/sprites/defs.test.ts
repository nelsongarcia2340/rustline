import { describe, expect, it } from 'vitest';
import { ENEMY_ROSTER, PLAYER_ROSTER } from '../../src/data/units';
import { SPRITES } from '../../src/sprites/defs';

function redChannel(hex: string): number {
  return parseInt(hex.slice(1, 3), 16);
}

function blueChannel(hex: string): number {
  return parseInt(hex.slice(5, 7), 16);
}

describe('sprite definitions', () => {
  it('has a sprite for every unit id', () => {
    for (const def of [...PLAYER_ROSTER, ...ENEMY_ROSTER]) {
      expect(SPRITES[def.id]).toBeDefined();
    }
  });

  it('keeps every frame in a sprite at identical dimensions', () => {
    for (const sprite of Object.values(SPRITES)) {
      const { walk1, walk2, attack } = sprite.frames;
      for (const frame of [walk1, walk2, attack]) {
        expect(frame.length).toBe(walk1.length);
        for (const row of frame) {
          expect(row.length).toBe(walk1[0].length);
        }
      }
    }
  });

  it('uses only palette-defined characters in every frame', () => {
    for (const sprite of Object.values(SPRITES)) {
      const allowed = new Set(Object.keys(sprite.palette));
      for (const frame of Object.values(sprite.frames)) {
        for (const row of frame) {
          for (const ch of row) {
            if (ch === '.') continue;
            expect(allowed.has(ch)).toBe(true);
          }
        }
      }
    }
  });

  it('gives player units a cool (blue-dominant) body color', () => {
    for (const def of PLAYER_ROSTER) {
      const body = SPRITES[def.id].palette.b;
      expect(blueChannel(body)).toBeGreaterThan(redChannel(body));
    }
  });

  it('gives enemy units a warm (red-dominant) body color', () => {
    for (const def of ENEMY_ROSTER) {
      const body = SPRITES[def.id].palette.b;
      expect(redChannel(body)).toBeGreaterThan(blueChannel(body));
    }
  });

  it('gives units distinguishable silhouettes, not one shape for everyone', () => {
    const ids = [...PLAYER_ROSTER, ...ENEMY_ROSTER].map((def) => def.id);
    const shapes = new Set(ids.map((id) => SPRITES[id].frames.walk1.join('\n')));
    expect(shapes.size).toBeGreaterThanOrEqual(5);
  });
});
