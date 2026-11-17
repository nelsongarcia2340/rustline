import { describe, it, expect } from 'vitest';
import { createWorld, step } from '../../src/sim/world';
import type { World } from '../../src/sim/world';
import { deploy } from '../../src/sim/economy';
import { STAGE_1 } from '../../src/data/stage1';
import type { StageEvent } from '../../src/data/stage1';
import { ENEMY_ROSTER } from '../../src/data/units';
import { BOSS_TRIGGER_HP, TICKS_PER_SEC } from '../../src/sim/constants';

/** Scripted player: Titan at >= 400 energy, then bulwark, bolt-gunner, scrapper. */
function strategyTick(world: World): void {
  if (world.energy >= 400) deploy(world, 'titan');
  deploy(world, 'bulwark');
  deploy(world, 'bolt-gunner');
  deploy(world, 'scrapper');
}

describe('stage script', () => {
  it('only references real enemy unit ids', () => {
    const enemyIds = new Set(ENEMY_ROSTER.map((u) => u.id));
    expect(STAGE_1.length).toBeGreaterThan(0);
    for (const e of STAGE_1) expect(enemyIds.has(e.type), `unknown enemy id ${e.type}`).toBe(true);
  });

  it('is sorted by atSecond ascending', () => {
    for (let i = 1; i < STAGE_1.length; i++) {
      expect(STAGE_1[i].atSecond).toBeGreaterThanOrEqual(STAGE_1[i - 1].atSecond);
    }
  });
});

describe('spawner', () => {
  it('spawns an event at second 6 at tick 180, not before', () => {
    const script: StageEvent[] = [{ atSecond: 6, type: 'rustbot' }];
    const w = createWorld();
    for (let i = 0; i < 179; i++) step(w, script);
    expect(w.tick).toBe(179);
    expect(w.units).toHaveLength(0);
    step(w, script);
    expect(w.tick).toBe(180);
    expect(w.units).toHaveLength(1);
    expect(w.units[0].def.id).toBe('rustbot');
    for (let i = 0; i < 30; i++) step(w, script);
    expect(w.units.filter((u) => u.def.id === 'rustbot' && u.uid === 1)).toHaveLength(1);
    expect(w.nextUid).toBe(2); // never spawned a second time
  });

  it('spawns several events due on the same tick, in order', () => {
    const script: StageEvent[] = [
      { atSecond: 1, type: 'rustbot' },
      { atSecond: 1, type: 'drone' },
    ];
    const w = createWorld();
    for (let i = 0; i < TICKS_PER_SEC; i++) step(w, script);
    expect(w.units.map((u) => u.def.id)).toEqual(['rustbot', 'drone']);
  });
});

describe('headless battle', () => {
  it('doing nothing for 300s loses', () => {
    const w = createWorld();
    for (let i = 0; i < 300 * TICKS_PER_SEC; i++) step(w);
    expect(w.status).toBe('lost');
    expect(w.baseHp.player).toBe(0);
  });

  it('a scripted strategy wins within 600s, and not implausibly fast', () => {
    const w = createWorld();
    while (w.status === 'playing' && w.tick < 600 * TICKS_PER_SEC) {
      strategyTick(w);
      step(w);
    }
    expect(w.status).toBe('won');
    expect(w.baseHp.enemy).toBe(0);
    expect(w.baseHp.player).toBeGreaterThan(0);
    expect(w.tick / TICKS_PER_SEC).toBeGreaterThan(120);
  });

  it('spawns the boss exactly once, and only after enemy base HP <= threshold', () => {
    expect(BOSS_TRIGGER_HP).toBe(1750);
    const w = createWorld();
    const overseerUids = new Set<number>();
    let sawBelowThreshold = false;
    while (w.status === 'playing' && w.tick < 600 * TICKS_PER_SEC) {
      strategyTick(w);
      step(w);
      const overseers = w.units.filter((u) => u.def.id === 'overseer');
      if (w.baseHp.enemy > BOSS_TRIGGER_HP) {
        expect(overseers).toHaveLength(0);
        expect(w.bossSpawned).toBe(false);
      } else {
        sawBelowThreshold = true;
      }
      for (const o of overseers) overseerUids.add(o.uid);
    }
    expect(w.status).toBe('won');
    expect(sawBelowThreshold).toBe(true);
    expect(w.bossSpawned).toBe(true);
    expect(overseerUids.size).toBe(1);
  });

  it('does not spawn the boss at all while the enemy base is above the threshold', () => {
    const w = createWorld();
    for (let i = 0; i < 100 * TICKS_PER_SEC; i++) step(w);
    expect(w.baseHp.enemy).toBeGreaterThan(BOSS_TRIGGER_HP);
    expect(w.bossSpawned).toBe(false);
    expect(w.units.some((u) => u.def.id === 'overseer')).toBe(false);
  });

  it('spawns the boss once when enemy base HP is at the threshold', () => {
    const w = createWorld();
    w.baseHp.enemy = BOSS_TRIGGER_HP;
    step(w, []);
    step(w, []);
    expect(w.units.filter((u) => u.def.id === 'overseer')).toHaveLength(1);
    expect(w.bossSpawned).toBe(true);
  });

  it('player base 0 loses even if the enemy base is also 0 (tie)', () => {
    const w = createWorld();
    w.baseHp.player = 0;
    w.baseHp.enemy = 0;
    step(w, []);
    expect(w.status).toBe('lost');
  });

  it('enemy base 0 alone wins', () => {
    const w = createWorld();
    w.baseHp.enemy = 0;
    step(w, []);
    expect(w.status).toBe('won');
  });

  it.each(['won', 'lost'] as const)('after %s, further steps change nothing', (status) => {
    const w = createWorld();
    for (let i = 0; i < 300; i++) step(w); // let some enemies spawn and walk
    w.baseHp[status === 'won' ? 'enemy' : 'player'] = 0;
    step(w);
    expect(w.status).toBe(status);
    const snapshot = structuredClone(w);
    for (let i = 0; i < 10; i++) step(w);
    expect(w).toEqual(snapshot);
  });
});
