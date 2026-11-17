import { getDef, type Side, type UnitDef } from '../data/units';
import { BASE_MAX_HP, SPAWN_X, TICKS_PER_SEC } from './constants';

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
}

export const START_ENERGY = 100;

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
  };
}

export function spawnUnit(world: World, defId: string): Unit {
  const def = getDef(defId);
  const unit: Unit = {
    uid: world.nextUid++,
    def,
    x: SPAWN_X[def.side],
    hp: def.hp,
    attackTimer: 0,
    staggerTicks: 0,
    kbStage: 0,
  };
  world.units.push(unit);
  return unit;
}

function moveUnits(world: World): void {
  for (const u of world.units) {
    if (u.staggerTicks > 0) {
      u.staggerTicks--;
      continue;
    }
    const dir = u.def.side === 'player' ? 1 : -1;
    u.x += (dir * u.def.speed) / TICKS_PER_SEC;
  }
}

/** Advance the simulation by one tick. Later phases (combat, economy, spawner) slot in here. */
export function step(world: World): void {
  world.tick++;
  moveUnits(world);
}
