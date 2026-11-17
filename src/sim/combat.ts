import type { Side } from '../data/units';
import { BASE_HALF_WIDTH, BASE_X, TICKS_PER_SEC } from './constants';
import type { Unit, World } from './world';

export type Target = { kind: 'unit'; unit: Unit } | { kind: 'base'; side: Side };

function opposing(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

/** Nearest living opposing unit within range, else the opposing base if in range, else null. */
export function findTarget(world: World, u: Unit): Target | null {
  const enemySide = opposing(u.def.side);
  let best: Unit | null = null;
  let bestDist = Infinity;
  for (const other of world.units) {
    if (other.def.side !== enemySide || other.hp <= 0) continue;
    const dist = Math.abs(u.x - other.x);
    if (dist <= u.def.range && dist < bestDist) {
      best = other;
      bestDist = dist;
    }
  }
  if (best) return { kind: 'unit', unit: best };
  if (Math.abs(u.x - BASE_X[enemySide]) - BASE_HALF_WIDTH <= u.def.range) {
    return { kind: 'base', side: enemySide };
  }
  return null;
}

export function applyDamage(world: World, target: Unit | Side, amount: number): void {
  if (typeof target === 'string') {
    world.baseHp[target] = Math.max(0, world.baseHp[target] - amount);
  } else {
    target.hp -= amount;
  }
}

/**
 * Each non-staggered unit counts its attack timer down, finds a target, attacks if ready,
 * and (when it has a target) is added to `held` so it does not move this tick.
 */
export function combatPhase(world: World, held: Set<Unit>): void {
  for (const u of world.units) {
    if (u.attackTimer > 0) u.attackTimer--;
    if (held.has(u)) continue; // staggered: no targeting, no attack
    const target = findTarget(world, u);
    if (!target) continue;
    held.add(u);
    if (u.attackTimer === 0) {
      applyDamage(world, target.kind === 'unit' ? target.unit : target.side, u.def.dmg);
      u.attackTimer = Math.round(u.def.attackIntervalSec * TICKS_PER_SEC);
    }
  }
}
