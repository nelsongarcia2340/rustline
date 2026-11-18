import type { Side } from '../data/units';
import type { Unit, World } from './world';
import { BASE_HALF_WIDTH, BASE_X, LANE_MAX, LANE_MIN, TICKS_PER_SEC } from './constants';

export type Target = { kind: 'unit'; unit: Unit } | { kind: 'base'; side: Side };

const KNOCKBACK_DISTANCE = 40;
const STAGGER_TICKS = 10;

function oppositeSide(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

export function findTarget(world: World, u: Unit): Target | null {
  const opp = oppositeSide(u.def.side);
  const inRange = world.units.filter(
    (other) => other.def.side === opp && other.hp > 0 && Math.abs(other.x - u.x) <= u.def.range,
  );

  if (inRange.length > 0) {
    const frontMost = inRange.reduce((front, candidate) =>
      u.def.side === 'player'
        ? (candidate.x < front.x ? candidate : front)
        : (candidate.x > front.x ? candidate : front),
    );
    return { kind: 'unit', unit: frontMost };
  }

  const baseX = BASE_X[opp];
  if (Math.abs(u.x - baseX) - BASE_HALF_WIDTH <= u.def.range) {
    return { kind: 'base', side: opp };
  }

  return null;
}

function hpStage(hp: number, maxHp: number): number {
  if (hp <= 0) return 3;
  if (hp <= maxHp / 3) return 2;
  if (hp <= (2 * maxHp) / 3) return 1;
  return 0;
}

function knockback(unit: Unit): void {
  const direction = unit.def.side === 'player' ? -1 : 1;
  const pushed = unit.x + direction * KNOCKBACK_DISTANCE;
  unit.x =
    unit.def.side === 'player'
      ? Math.max(pushed, BASE_X.player, LANE_MIN)
      : Math.min(pushed, BASE_X.enemy, LANE_MAX);
  unit.staggerTicks = STAGGER_TICKS;
}

export function applyDamage(world: World, target: Unit | Side, amount: number): void {
  if (typeof target === 'string') {
    world.baseHp[target] -= amount;
    return;
  }

  target.hp -= amount;
  const stage = hpStage(target.hp, target.def.hp);
  if (stage > target.kbStage) {
    target.kbStage = stage;
    knockback(target);
  }
}

function moveUnit(u: Unit): void {
  const direction = u.def.side === 'player' ? 1 : -1;
  u.x += (direction * u.def.speed) / TICKS_PER_SEC;
}

function resolveAttack(world: World, attacker: Unit, target: Target): void {
  if (target.kind === 'base') {
    applyDamage(world, target.side, attacker.def.dmg);
    return;
  }

  if (attacker.def.splashRadius <= 0) {
    applyDamage(world, target.unit, attacker.def.dmg);
    return;
  }

  const hits = world.units.filter(
    (other) =>
      other.def.side === target.unit.def.side &&
      other.hp > 0 &&
      Math.abs(other.x - target.unit.x) <= attacker.def.splashRadius,
  );
  for (const hit of hits) {
    applyDamage(world, hit, attacker.def.dmg);
  }
}

export function combatPhase(world: World): void {
  for (const unit of world.units) {
    if (unit.hp <= 0) {
      continue;
    }

    if (unit.staggerTicks > 0) {
      unit.staggerTicks -= 1;
      continue;
    }

    const target = findTarget(world, unit);
    if (!target) {
      moveUnit(unit);
      continue;
    }

    unit.attackTimer -= 1;
    if (unit.attackTimer > 0) {
      continue;
    }

    resolveAttack(world, unit, target);
    unit.attackTimer = Math.round(unit.def.attackIntervalSec * TICKS_PER_SEC);
  }
}
