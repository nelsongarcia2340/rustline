import type { Side } from '../data/units';
import { BASE_HALF_WIDTH, BASE_X, TICKS_PER_SEC } from './constants';

const KNOCKBACK_DISTANCE = 40;
const STAGGER_TICKS = 10;
const KNOCKBACK_STAGES = 3;
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

/** Push a unit away from the enemy, never past its own base. */
function knockBack(u: Unit): void {
  if (u.def.side === 'player') {
    u.x = Math.max(BASE_X.player, u.x - KNOCKBACK_DISTANCE);
  } else {
    u.x = Math.min(BASE_X.enemy, u.x + KNOCKBACK_DISTANCE);
  }
}

/**
 * Damage a unit or base. A surviving unit is knocked back once whenever a new 1/3 HP-loss
 * threshold has been crossed (even if one hit crosses two). Dead units are removed by `step`.
 */
export function applyDamage(world: World, target: Unit | Side, amount: number): void {
  if (typeof target === 'string') {
    world.baseHp[target] = Math.max(0, world.baseHp[target] - amount);
    return;
  }
  target.hp -= amount;
  if (target.hp <= 0) return;
  let crossed = 0;
  for (let k = 1; k < KNOCKBACK_STAGES; k++) {
    if (target.hp <= target.def.hp * (1 - k / KNOCKBACK_STAGES)) crossed = k;
  }
  if (crossed > target.kbStage) {
    target.kbStage = crossed;
    target.staggerTicks = STAGGER_TICKS;
    knockBack(target);
  }
}

/** An attacker's hit on its target; splash also hits every living opposing unit near the target. */
function attack(world: World, attacker: Unit, target: Target): void {
  const dmg = attacker.def.dmg;
  const center = target.kind === 'unit' ? target.unit.x : BASE_X[target.side];
  // Collect first so knockback moves do not change who is in the radius.
  const victims: Unit[] = [];
  if (attacker.def.splashRadius > 0) {
    const enemySide = opposing(attacker.def.side);
    for (const other of world.units) {
      if (other.def.side !== enemySide || other.hp <= 0) continue;
      if (Math.abs(other.x - center) <= attacker.def.splashRadius) victims.push(other);
    }
  }
  if (target.kind === 'unit') {
    if (!victims.includes(target.unit)) victims.push(target.unit);
  } else {
    applyDamage(world, target.side, dmg);
  }
  for (const v of victims) applyDamage(world, v, dmg);
}

/**
 * Every unit's attack timer counts down each tick (staggered units included); only targeting
 * and attacking are skipped for staggered units (those in `held` on entry). A unit that has a
 * target is added to `held` so it does not move this tick. Units already at 0 HP from earlier
 * in the same tick still attack; `step` removes dead units afterwards.
 */
export function combatPhase(world: World, held: Set<Unit>): void {
  for (const u of world.units) {
    if (u.attackTimer > 0) u.attackTimer--;
    if (held.has(u)) continue; // staggered: no targeting, no attack
    const target = findTarget(world, u);
    if (!target) continue;
    held.add(u);
    if (u.attackTimer === 0) {
      attack(world, u, target);
      u.attackTimer = Math.round(u.def.attackIntervalSec * TICKS_PER_SEC);
    }
  }
}
