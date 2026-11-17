import { describe, it, expect } from 'vitest';
import { createWorld, spawnUnit, step } from '../../src/sim/world';
import { applyDamage, findTarget } from '../../src/sim/combat';

describe('findTarget', () => {
  it('returns null when nothing is in range', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    const r = spawnUnit(w, 'rustbot');
    r.x = s.x + 100;
    expect(findTarget(w, s)).toBeNull();
  });

  it('picks the front-most (nearest) opposing unit in range', () => {
    const w = createWorld();
    const g = spawnUnit(w, 'bolt-gunner');
    const far = spawnUnit(w, 'rustbot');
    const near = spawnUnit(w, 'rustbot');
    far.x = g.x + 200;
    near.x = g.x + 100;
    expect(findTarget(w, g)).toEqual({ kind: 'unit', unit: near });
  });

  it('ignores friendly units and dead units', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    const friend = spawnUnit(w, 'scrapper');
    friend.x = s.x + 5;
    const dead = spawnUnit(w, 'rustbot');
    dead.x = s.x + 10;
    dead.hp = 0;
    expect(findTarget(w, s)).toBeNull();
  });

  it('targets the opposing base when within base range', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 2900 - 60 - 30;
    expect(findTarget(w, s)).toEqual({ kind: 'base', side: 'enemy' });
    s.x -= 1;
    expect(findTarget(w, s)).toBeNull();
  });

  it('enemy units target the player base', () => {
    const w = createWorld();
    const r = spawnUnit(w, 'rustbot');
    r.x = 100 + 60 + 30;
    expect(findTarget(w, r)).toEqual({ kind: 'base', side: 'player' });
  });
});

describe('applyDamage', () => {
  it('reduces unit hp and base hp', () => {
    const w = createWorld();
    const r = spawnUnit(w, 'rustbot');
    applyDamage(w, r, 12);
    expect(r.hp).toBe(138);
    applyDamage(w, 'enemy', 12);
    expect(w.baseHp.enemy).toBe(3488);
  });

  it('floors base hp at 0', () => {
    const w = createWorld();
    applyDamage(w, 'player', 99999);
    expect(w.baseHp.player).toBe(0);
  });
});

describe('combat in step', () => {
  it('stops to fight a unit in range and attacks immediately, then every 24 ticks', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    const r = spawnUnit(w, 'rustbot');
    r.x = s.x + 20;
    step(w);
    expect(r.hp).toBe(150 - 12);
    expect(s.x).toBe(160);
    expect(r.x).toBe(180);
    for (let i = 0; i < 23; i++) step(w);
    expect(w.tick).toBe(24);
    expect(r.hp).toBe(138);
    step(w);
    expect(w.tick).toBe(25);
    expect(r.hp).toBe(126);
  });

  it('walks to the enemy base with no enemies, stops in range and damages the base', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    for (let i = 0; i < 3000 && w.baseHp.enemy === 3500; i++) step(w, []);
    expect(w.baseHp.enemy).toBe(3500 - 12);
    expect(Math.abs(s.x - 2900) - 60).toBeLessThanOrEqual(30);
    const stoppedAt = s.x;
    for (let i = 0; i < 10; i++) step(w, []);
    expect(s.x).toBe(stoppedAt);
  });

  it('enemy with no opposing units walks to the player base without stalling', () => {
    const w = createWorld();
    const r = spawnUnit(w, 'rustbot');
    for (let i = 0; i < 3000 && w.baseHp.player === 2000; i++) step(w, []);
    expect(w.baseHp.player).toBe(2000 - 10);
    expect(Math.abs(r.x - 100) - 60).toBeLessThanOrEqual(30);
  });

  it('a Bolt-Gunner hits an enemy 200 units away but not 300 away', () => {
    const w = createWorld();
    const g = spawnUnit(w, 'bolt-gunner');
    const near = spawnUnit(w, 'rustbot');
    near.x = g.x + 200;
    step(w);
    expect(near.hp).toBe(150 - 18);
    expect(g.x).toBe(160);

    const w2 = createWorld();
    const g2 = spawnUnit(w2, 'bolt-gunner');
    const far = spawnUnit(w2, 'rustbot');
    far.x = g2.x + 300;
    step(w2);
    expect(far.hp).toBe(150);
    expect(g2.x).toBeGreaterThan(160);
  });

  it('hits the front-most of two enemies in range', () => {
    const w = createWorld();
    const g = spawnUnit(w, 'bolt-gunner');
    const back = spawnUnit(w, 'rustbot');
    const front = spawnUnit(w, 'rustbot');
    back.x = g.x + 200;
    front.x = g.x + 150;
    step(w);
    expect(front.hp).toBe(132);
    expect(back.hp).toBe(150);
  });

  it('staggered units neither move nor attack, and stagger counts down once per tick', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    const r = spawnUnit(w, 'rustbot');
    r.x = s.x + 20;
    s.staggerTicks = 3;
    step(w);
    expect(s.staggerTicks).toBe(2);
    expect(r.hp).toBe(150);
    step(w);
    step(w);
    expect(s.staggerTicks).toBe(0);
    expect(r.hp).toBe(150);
    step(w);
    expect(r.hp).toBe(138);
  });
});
