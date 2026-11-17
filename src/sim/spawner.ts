import type { StageEvent } from '../data/stage1';
import { TICKS_PER_SEC } from './constants';
import { spawnUnit } from './spawn';
import type { World } from './world';

/** Spawn every not-yet-fired script event that is due by the current tick. The script must be sorted by atSecond. */
export function spawnerPhase(world: World, script: StageEvent[]): void {
  while (world.spawnIndex < script.length) {
    const event = script[world.spawnIndex];
    if (event.atSecond * TICKS_PER_SEC > world.tick) break;
    spawnUnit(world, event.type);
    world.spawnIndex++;
  }
}
