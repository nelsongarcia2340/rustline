import { getDef } from '../data/units';
import { ENERGY_CAP, ENERGY_REGEN_PER_SEC, TICKS_PER_SEC } from './constants';
import { spawnUnit, type World } from './world';

/** Regenerate energy and tick deploy cooldowns down. `world.cooldowns` holds remaining ticks. */
export function economyPhase(world: World): void {
  world.energy = Math.min(ENERGY_CAP, world.energy + ENERGY_REGEN_PER_SEC / TICKS_PER_SEC);
  for (const id of Object.keys(world.cooldowns)) {
    const remaining = world.cooldowns[id] - 1;
    if (remaining > 0) world.cooldowns[id] = remaining;
    else delete world.cooldowns[id];
  }
}

export function canDeploy(world: World, defId: string): boolean {
  if (world.status !== 'playing') return false;
  const def = getDef(defId);
  if (def.side !== 'player') return false;
  if (world.energy < def.cost) return false;
  return (world.cooldowns[defId] ?? 0) <= 0;
}

/** Spend energy, start the cooldown and spawn the unit. Returns false (changing nothing) if not allowed. */
export function deploy(world: World, defId: string): boolean {
  if (!canDeploy(world, defId)) return false;
  const def = getDef(defId);
  world.energy -= def.cost;
  world.cooldowns[defId] = Math.round(def.cooldownSec * TICKS_PER_SEC);
  spawnUnit(world, defId);
  return true;
}
