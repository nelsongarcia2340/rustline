import type { Side, UnitDef } from '../data/units';
import { STAGE_1 } from '../data/stage1';
import type { StageEvent } from '../data/stage1';
import { combatPhase } from './combat';
import { BASE_MAX_HP, BOSS_TRIGGER_HP, START_ENERGY, TICKS_PER_SEC } from './constants';
import { economyPhase } from './economy';
import { spawnUnit } from './spawn';
import { spawnerPhase } from './spawner';

export interface Unit {
  uid: number;
  def: UnitDef;
  x: number;
  hp: number;
  attackTimer: number;
  staggerTicks: number;
  kbStage: number;
}

export interface World {
  tick: number;
  units: Unit[];
  baseHp: Record<Side, number>;
  energy: number;
  cooldowns: Record<string, number>;
  status: 'playing' | 'won' | 'lost';
  bossSpawned: boolean;
  nextUid: number;
  /** Index of the next STAGE script event that has not fired yet. */
  spawnIndex: number;
}

export function createWorld(): World {
  return {
    tick: 0,
    units: [],
    baseHp: { ...BASE_MAX_HP },
    energy: START_ENERGY,
    cooldowns: {},
    status: 'playing',
    bossSpawned: false,
    nextUid: 1,
    spawnIndex: 0,
  };
}

export { spawnUnit } from './spawn';

/** Units in `held` (staggered or fighting) do not walk this tick. */
function moveUnits(world: World, held: Set<Unit>): void {
  for (const u of world.units) {
    if (held.has(u)) continue;
    const dir = u.def.side === 'player' ? 1 : -1;
    u.x += (dir * u.def.speed) / TICKS_PER_SEC;
  }
}

/**
 * Advance the simulation by one tick. A finished game is frozen: nothing changes.
 * Phases: tick, spawner, economy, stagger/combat/movement/removal, boss, win/lose.
 */
export function step(world: World, script: StageEvent[] = STAGE_1): void {
  if (world.status !== 'playing') return;
  world.tick++;
  spawnerPhase(world, script);
  economyPhase(world);
  const held = new Set<Unit>();
  for (const u of world.units) {
    if (u.staggerTicks > 0) {
      u.staggerTicks--;
      held.add(u);
    }
  }
  combatPhase(world, held);
  for (const u of world.units) {
    if (u.staggerTicks > 0) held.add(u); // knocked back this tick: do not walk it back immediately
  }
  moveUnits(world, held);
  // Dead units are removed only now, so same-tick exchanges stay simultaneous.
  world.units = world.units.filter((u) => u.hp > 0);

  if (!world.bossSpawned && world.baseHp.enemy > 0 && world.baseHp.enemy <= BOSS_TRIGGER_HP) {
    spawnUnit(world, 'overseer');
    world.bossSpawned = true;
  }

  // Player loss takes precedence over a simultaneous enemy-base kill.
  if (world.baseHp.player <= 0) world.status = 'lost';
  else if (world.baseHp.enemy <= 0) world.status = 'won';
}
