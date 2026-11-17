import { getDef } from '../data/units';
import { SPAWN_X } from './constants';
import type { Unit, World } from './world';

/** Create a unit of the given def id at its side's spawn point and add it to the world. */
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
