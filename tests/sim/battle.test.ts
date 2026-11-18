import { describe, expect, it } from 'vitest';
import { STAGE_1 } from '../../src/data/stage1';
import { getDef } from '../../src/data/units';
import { canDeploy, deploy } from '../../src/sim/economy';
import { createWorld, step } from '../../src/sim/world';

describe('stage data', () => {
  it('references a real unit id for every event', () => {
    for (const event of STAGE_1) {
      expect(() => getDef(event.type)).not.toThrow();
    }
  });
});

describe('headless battle', () => {
  it('loses within 300s if the player does nothing', () => {
    const world = createWorld();
    for (let i = 0; i < 300 * 30; i++) step(world);
    expect(world.status).toBe('lost');
  });

  it('spawns the boss exactly once, only after the enemy base drops to half', () => {
    const world = createWorld();
    const priority = ['bulwark', 'bolt-gunner', 'scrapper', 'titan'];
    let bossSeenEarly = false;
    for (let i = 0; i < 600 * 30 && world.status === 'playing'; i++) {
      for (const id of priority) {
        if (canDeploy(world, id)) deploy(world, id);
      }
      if (world.baseHp.enemy > 1750 && world.units.some((u) => u.def.id === 'overseer')) {
        bossSeenEarly = true;
      }
      step(world);
    }
    expect(bossSeenEarly).toBe(false);
    expect(world.bossSpawned).toBe(true);
  });

  it('wins within 600s with a simple always-spend strategy', () => {
    const world = createWorld();
    const priority = ['bulwark', 'bolt-gunner', 'scrapper', 'titan'];
    for (let i = 0; i < 600 * 30 && world.status === 'playing'; i++) {
      for (const id of priority) {
        if (canDeploy(world, id)) deploy(world, id);
      }
      step(world);
    }
    expect(world.status).toBe('won');
  });

  it('freezes the world once the game is over', () => {
    const world = createWorld();
    world.status = 'won';
    world.baseHp.enemy = 1234;
    step(world);
    expect(world.baseHp.enemy).toBe(1234);
    expect(world.tick).toBe(0);
  });
});
