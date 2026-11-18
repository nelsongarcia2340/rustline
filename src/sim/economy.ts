import { getDef } from '../data/units';
import { TICKS_PER_SEC } from './constants';
import type { World } from './world';
import { spawnUnit } from './world';

const ENERGY_REGEN_PER_SEC = 24;
const ENERGY_CAP = 600;

export function canDeploy(world: World, defId: string): boolean {
  if (world.status !== 'playing') {
    return false;
  }
  const def = getDef(defId);
  const cooldownRemaining = world.cooldowns[defId] ?? 0;
  return cooldownRemaining <= 0 && world.energy >= def.cost;
}

export function deploy(world: World, defId: string): boolean {
  if (!canDeploy(world, defId)) {
    return false;
  }
  const def = getDef(defId);
  world.energy -= def.cost;
  world.cooldowns[defId] = Math.round(def.cooldownSec * TICKS_PER_SEC);
  spawnUnit(world, defId);
  return true;
}

export function economyPhase(world: World): void {
  world.energy = Math.min(ENERGY_CAP, world.energy + ENERGY_REGEN_PER_SEC / TICKS_PER_SEC);
  for (const id of Object.keys(world.cooldowns)) {
    if (world.cooldowns[id] > 0) {
      world.cooldowns[id] -= 1;
    }
  }
}
