import { describe, expect, it } from 'vitest';
import { ENEMY_ROSTER, PLAYER_ROSTER, getDef } from '../../src/data/units';

describe('unit rosters', () => {
  it('has 5 player units and 5 enemy units', () => {
    expect(PLAYER_ROSTER).toHaveLength(5);
    expect(ENEMY_ROSTER).toHaveLength(5);
  });

  it('defines titan with the spec stats', () => {
    const titan = getDef('titan');
    expect(titan.cost).toBe(400);
    expect(titan.hp).toBe(900);
    expect(titan.dmg).toBe(60);
    expect(titan.splashRadius).toBe(90);
  });

  it('defines scrapper with the spec stats', () => {
    const scrapper = getDef('scrapper');
    expect(scrapper.cost).toBe(50);
    expect(scrapper.cooldownSec).toBe(2);
    expect(scrapper.hp).toBe(120);
  });

  it('throws on an unknown id', () => {
    expect(() => getDef('nope')).toThrow();
  });

  it('gives every unit positive hp and speed', () => {
    for (const def of [...PLAYER_ROSTER, ...ENEMY_ROSTER]) {
      expect(def.hp).toBeGreaterThan(0);
      expect(def.speed).toBeGreaterThan(0);
    }
  });
});
