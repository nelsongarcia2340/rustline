import { describe, expect, it } from 'vitest';
import { hash01, isWindowLit } from '../../src/render/skyline';

describe('hash01', () => {
  it('is deterministic and within [0, 1)', () => {
    for (let n = -50; n < 50; n++) {
      const v = hash01(n);
      expect(v).toBe(hash01(n));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('isWindowLit', () => {
  it('is a pure function of (seed, building, column, row)', () => {
    for (let b = -5; b < 40; b++) {
      for (let col = 0; col < 8; col++) {
        for (let row = 0; row < 8; row++) {
          expect(isWindowLit(53, b, col, row)).toBe(isWindowLit(53, b, col, row));
        }
      }
    }
  });

  it('lights a plausible minority of windows and differs between buildings and seeds', () => {
    let lit = 0;
    let total = 0;
    let diffBuildings = 0;
    let diffSeeds = 0;
    for (let b = 0; b < 60; b++) {
      for (let col = 0; col < 8; col++) {
        for (let row = 0; row < 8; row++) {
          total++;
          if (isWindowLit(53, b, col, row)) lit++;
          if (isWindowLit(53, b, col, row) !== isWindowLit(53, b + 1, col, row)) diffBuildings++;
          if (isWindowLit(53, b, col, row) !== isWindowLit(11, b, col, row)) diffSeeds++;
        }
      }
    }
    expect(lit / total).toBeGreaterThan(0.08);
    expect(lit / total).toBeLessThan(0.3);
    expect(diffBuildings).toBeGreaterThan(0);
    expect(diffSeeds).toBeGreaterThan(0);
  });
});
