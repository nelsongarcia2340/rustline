import { STAGE_1 } from '../data/stage1';
import { TICKS_PER_SEC } from './constants';
import type { World } from './world';
import { spawnUnit } from './world';

const BOSS_TRIGGER_HP = 1750;

export function spawnerPhase(world: World): void {
  for (const event of STAGE_1) {
    if (Math.round(event.atSecond * TICKS_PER_SEC) === world.tick) {
      spawnUnit(world, event.type);
    }
  }

  if (!world.bossSpawned && world.baseHp.enemy <= BOSS_TRIGGER_HP) {
    spawnUnit(world, 'overseer');
    world.bossSpawned = true;
  }
}
