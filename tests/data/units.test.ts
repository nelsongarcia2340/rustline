import { describe, expect, it } from 'vitest';
import { ENEMY_ROSTER, PLAYER_ROSTER, getDef } from '../../src/data/units';

describe('unit data', () => {
  it('has 5 player and 5 enemy units', () => {
    expect(PLAYER_ROSTER).toHaveLength(5);
    expect(ENEMY_ROSTER).toHaveLength(5);
  });

  it('keeps deploy-bar order for the player roster', () => {
    expect(PLAYER_ROSTER.map((d) => d.id)).toEqual([
      'scrapper', 'bolt-gunner', 'bulwark', 'sprinter', 'titan',
    ]);
    expect(ENEMY_ROSTER.map((d) => d.id)).toEqual([
      'rustbot', 'drone', 'turret-walker', 'siege-tank', 'overseer',
    ]);
  });

  it('tags each roster with its side', () => {
    expect(PLAYER_ROSTER.every((d) => d.side === 'player')).toBe(true);
    expect(ENEMY_ROSTER.every((d) => d.side === 'enemy')).toBe(true);
  });

  it('defines titan as a heavy splash unit', () => {
    const titan = getDef('titan');
    expect(titan).toMatchObject({ cost: 400, hp: 900, dmg: 60, splashRadius: 90 });
  });

  it('defines scrapper as the cheap swarm unit', () => {
    expect(getDef('scrapper')).toMatchObject({ cost: 50, cooldownSec: 2, hp: 120 });
  });

  it('defines the overseer boss with splash', () => {
    expect(getDef('overseer')).toMatchObject({ hp: 2000, dmg: 50, splashRadius: 120 });
  });

  it('throws on an unknown id', () => {
    expect(() => getDef('nope')).toThrow();
  });

  it('gives every unit positive hp, speed and attack interval', () => {
    for (const d of [...PLAYER_ROSTER, ...ENEMY_ROSTER]) {
      expect(d.hp).toBeGreaterThan(0);
      expect(d.speed).toBeGreaterThan(0);
      expect(d.attackIntervalSec).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = [...PLAYER_ROSTER, ...ENEMY_ROSTER].map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
