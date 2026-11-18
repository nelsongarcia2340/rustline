import { describe, it, expect } from 'vitest';
import { createWorld, step } from '../../src/sim/world';
import type { World } from '../../src/sim/world';
import { deploy } from '../../src/sim/economy';
import { STAGE_1 } from '../../src/data/stage1';
import type { StageEvent } from '../../src/data/stage1';
import { ENEMY_ROSTER } from '../../src/data/units';
import { BASE_MAX_HP, BOSS_TRIGGER_HP, TICKS_PER_SEC } from '../../src/sim/constants';

const count = (world: World, id: string): number => world.units.filter((u) => u.def.id === id).length;

/**
 * Simple deterministic player: save up for a Titan (>= 400 energy); otherwise keep one Bulwark in front,
 * Bolt-Gunners behind it (3 per Bulwark, they outrange the Overseer), and Scrappers only as filler once
 * energy is comfortably high so the Titan fund is not starved.
 */
function sensibleStrategy(world: World): void {
  if (world.energy >= 400) {
    deploy(world, 'titan');
    return;
  }
  if (count(world, 'bulwark') < 1) deploy(world, 'bulwark');
  else if (count(world, 'bolt-gunner') < 3 * count(world, 'bulwark') && world.energy >= 150) deploy(world, 'bolt-gunner');
  else if (world.energy >= 250) deploy(world, 'scrapper');
}

interface RunRecord {
  world: World;
  /** Every enemy def id that was ever present in the world. */
  seenEnemyIds: Set<string>;
  /** uids of every Overseer ever seen. */
  overseerUids: Set<number>;
  /** Furthest an enemy unit got toward the player base (lowest x), Infinity if none ever existed. */
  minEnemyX: number;
  /** Lowest player base HP seen. */
  minPlayerHp: number;
  /** Enemy base HP the first time an Overseer was seen, or null. */
  enemyHpWhenBossSeen: number | null;
  /** Enemy base HP seen on every tick before the first Overseer appeared, minimum. */
  minEnemyHpBeforeBoss: number;
}

function runBattle(strategy: (w: World) => void, maxSeconds: number): RunRecord {
  const world = createWorld();
  const rec: RunRecord = {
    world,
    seenEnemyIds: new Set(),
    overseerUids: new Set(),
    minEnemyX: Infinity,
    minPlayerHp: world.baseHp.player,
    enemyHpWhenBossSeen: null,
    minEnemyHpBeforeBoss: world.baseHp.enemy,
  };
  while (world.status === 'playing' && world.tick < maxSeconds * TICKS_PER_SEC) {
    strategy(world);
    step(world);
    for (const u of world.units) {
      if (u.def.side !== 'enemy') continue;
      rec.seenEnemyIds.add(u.def.id);
      rec.minEnemyX = Math.min(rec.minEnemyX, u.x);
      if (u.def.id === 'overseer') {
        rec.overseerUids.add(u.uid);
        rec.enemyHpWhenBossSeen ??= world.baseHp.enemy;
      }
    }
    rec.minPlayerHp = Math.min(rec.minPlayerHp, world.baseHp.player);
    if (rec.overseerUids.size === 0) rec.minEnemyHpBeforeBoss = Math.min(rec.minEnemyHpBeforeBoss, world.baseHp.enemy);
  }
  return rec;
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
    expect(w.units.filter((u) => u.def.id === 'rustbot')).toHaveLength(1);
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

  it('a sensible strategy wins in about 3-4.5 minutes of game time, under real pressure', () => {
    const rec = runBattle(sensibleStrategy, 600);
    const seconds = rec.world.tick / TICKS_PER_SEC;
    expect(rec.world.status).toBe('won');
    expect(rec.world.baseHp.enemy).toBe(0);
    // Measured ~211s after tuning (was 490s); band is measured +/- 25%.
    expect(seconds).toBeGreaterThan(160);
    expect(seconds).toBeLessThan(265);
    // The player is actually threatened at some point: base damaged, or an enemy got past mid-lane.
    const threatened = rec.minPlayerHp < BASE_MAX_HP.player || rec.minEnemyX < 1500;
    expect(threatened).toBe(true);
  });

  it('spamming only Scrappers does not win', () => {
    const rec = runBattle((w) => void deploy(w, 'scrapper'), 600);
    expect(rec.world.status).toBe('lost');
  });

  it('every enemy type in the roster actually spawns during a full run', () => {
    const rec = runBattle(sensibleStrategy, 600);
    for (const def of ENEMY_ROSTER) expect(rec.seenEnemyIds.has(def.id), `${def.id} never spawned`).toBe(true);
  });

  it('spawns the boss exactly once, and only once enemy base HP <= threshold', () => {
    expect(BOSS_TRIGGER_HP).toBe(1750);
    const rec = runBattle(sensibleStrategy, 600);
    expect(rec.world.status).toBe('won');
    expect(rec.overseerUids.size).toBe(1);
    expect(rec.world.bossSpawned).toBe(true);
    expect(rec.enemyHpWhenBossSeen).not.toBeNull();
    expect(rec.enemyHpWhenBossSeen!).toBeLessThanOrEqual(BOSS_TRIGGER_HP);
    expect(rec.minEnemyHpBeforeBoss).toBeGreaterThan(BOSS_TRIGGER_HP);
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

  it('does not spawn the boss in a game that is won on that very tick', () => {
    const w = createWorld();
    w.baseHp.enemy = 0;
    step(w, []);
    expect(w.status).toBe('won');
    expect(w.bossSpawned).toBe(false);
    expect(w.units.some((u) => u.def.id === 'overseer')).toBe(false);
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
