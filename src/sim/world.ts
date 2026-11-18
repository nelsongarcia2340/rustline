import type { Side, UnitDef } from '../data/units';
import { getDef } from '../data/units';
import { combatPhase } from './combat';
import { BASE_MAX_HP, SPAWN_X } from './constants';

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
    baseHp: { player: BASE_MAX_HP.player, enemy: BASE_MAX_HP.enemy },
    energy: 100,
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

export function step(world: World): void {
  world.tick += 1;
  combatPhase(world);
}
