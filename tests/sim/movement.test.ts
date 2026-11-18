import { describe, expect, it } from 'vitest';
import { createWorld, spawnUnit, step } from '../../src/sim/world';

describe('world creation', () => {
  it('starts with 100 energy, base hp, and playing status', () => {
    const world = createWorld();
    expect(world.energy).toBe(100);
    expect(world.baseHp.player).toBe(2000);
    expect(world.baseHp.enemy).toBe(3500);
    expect(world.status).toBe('playing');
  });
});

describe('spawning', () => {
  it('spawns a player unit at the player spawn point', () => {
    const world = createWorld();
    const scrapper = spawnUnit(world, 'scrapper');
    expect(scrapper.x).toBe(160);
  });

  it('spawns an enemy unit at the enemy spawn point', () => {
    const world = createWorld();
    const rustbot = spawnUnit(world, 'rustbot');
    expect(rustbot.x).toBe(1940);
  });
});

describe('movement', () => {
  it('moves a player unit toward the enemy base over 1 second', () => {
    const world = createWorld();
    const scrapper = spawnUnit(world, 'scrapper');
    for (let i = 0; i < 30; i++) step(world);
    expect(scrapper.x).toBeCloseTo(220, 6);
  });

  it('moves an enemy unit toward the player base over 1 second', () => {
    const world = createWorld();
    const rustbot = spawnUnit(world, 'rustbot');
    for (let i = 0; i < 30; i++) step(world);
    expect(rustbot.x).toBeCloseTo(1890, 6);
  });
});
