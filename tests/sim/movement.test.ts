import { describe, it, expect } from 'vitest';
import { createWorld, spawnUnit, step } from '../../src/sim/world';

describe('world creation', () => {
  it('starts with full energy, base HP and playing status', () => {
    const w = createWorld();
    expect(w.energy).toBe(100);
    expect(w.baseHp.player).toBe(2000);
    expect(w.baseHp.enemy).toBe(3500);
    expect(w.status).toBe('playing');
    expect(w.tick).toBe(0);
    expect(w.units).toHaveLength(0);
  });
});

describe('spawning', () => {
  it('places player units at the player spawn point', () => {
    const w = createWorld();
    const u = spawnUnit(w, 'scrapper');
    expect(u.x).toBe(160);
    expect(u.hp).toBe(120);
    expect(w.units).toContain(u);
  });

  it('places enemy units at the enemy spawn point', () => {
    const w = createWorld();
    expect(spawnUnit(w, 'rustbot').x).toBe(2840);
  });

  it('assigns unique uids', () => {
    const w = createWorld();
    const a = spawnUnit(w, 'scrapper');
    const b = spawnUnit(w, 'scrapper');
    expect(a.uid).not.toBe(b.uid);
  });
});

describe('movement', () => {
  it('moves player units toward the enemy base and enemies toward the player base', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    const r = spawnUnit(w, 'rustbot');
    for (let i = 0; i < 30; i++) step(w);
    expect(w.tick).toBe(30);
    expect(s.x).toBeCloseTo(220, 5);
    expect(r.x).toBeCloseTo(2790, 5);
  });

  it('does not move staggered units and counts the stagger down', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.staggerTicks = 2;
    step(w);
    step(w);
    expect(s.x).toBe(160);
    expect(s.staggerTicks).toBe(0);
    step(w);
    expect(s.x).toBeCloseTo(162, 5);
  });
});
