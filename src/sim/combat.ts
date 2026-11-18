import type { Side } from '../data/units';
import type { Unit, World } from './world';
import { BASE_HALF_WIDTH, BASE_X, TICKS_PER_SEC } from './constants';

export type Target = { kind: 'unit'; unit: Unit } | { kind: 'base'; side: Side };

function oppositeSide(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

export function findTarget(world: World, u: Unit): Target | null {
  const opp = oppositeSide(u.def.side);
  const inRange = world.units.filter(
    (other) => other.def.side === opp && Math.abs(other.x - u.x) <= u.def.range,
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

export function applyDamage(world: World, target: Unit | Side, amount: number): void {
  if (typeof target === 'string') {
    world.baseHp[target] -= amount;
  } else {
    target.hp -= amount;
  }
}

function moveUnit(u: Unit): void {
  const direction = u.def.side === 'player' ? 1 : -1;
  u.x += (direction * u.def.speed) / TICKS_PER_SEC;
}

export function combatPhase(world: World): void {
  for (const unit of world.units) {
    const target = findTarget(world, unit);
    if (!target) {
      moveUnit(unit);
      continue;
    }

    unit.attackTimer -= 1;
    if (unit.attackTimer > 0) {
      continue;
    }

    applyDamage(world, target.kind === 'unit' ? target.unit : target.side, unit.def.dmg);
    unit.attackTimer = Math.round(unit.def.attackIntervalSec * TICKS_PER_SEC);
  }
}
