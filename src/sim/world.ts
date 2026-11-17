import { getDef, type Side, type UnitDef } from '../data/units';
import { combatPhase } from './combat';
import { BASE_MAX_HP, SPAWN_X, START_ENERGY, TICKS_PER_SEC } from './constants';
import { economyPhase } from './economy';

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

/** Units in `held` (staggered or fighting) do not walk this tick. */
function moveUnits(world: World, held: Set<Unit>): void {
  for (const u of world.units) {
    if (held.has(u)) continue;
    const dir = u.def.side === 'player' ? 1 : -1;
    u.x += (dir * u.def.speed) / TICKS_PER_SEC;
  }
}

/** Advance the simulation by one tick. Later phases (spawner) slot in here. */
export function step(world: World): void {
  world.tick++;
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
}
