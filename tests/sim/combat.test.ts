import { describe, expect, it } from 'vitest';
import { combatPhase } from '../../src/sim/combat';
import { createWorld, spawnUnit, step } from '../../src/sim/world';

describe('melee engagement', () => {
  it('stops and attacks a nearby enemy, then waits out its cooldown', () => {
    const world = createWorld();
    const scrapper = spawnUnit(world, 'scrapper');
    const rustbot = spawnUnit(world, 'rustbot');
    rustbot.x = scrapper.x + 20;

    step(world);
    expect(rustbot.hp).toBe(150 - 12);
    expect(scrapper.x).toBe(160);

    for (let i = 0; i < 23; i++) step(world);
    expect(rustbot.hp).toBe(150 - 12);

    step(world);
    expect(rustbot.hp).toBe(150 - 24);
  });
});

describe('walking to the base', () => {
  it('walks to the enemy base and attacks it when no enemies are present', () => {
    const world = createWorld();
    const scrapper = spawnUnit(world, 'scrapper');

    for (let i = 0; i < 1326; i++) combatPhase(world);

    expect(scrapper.x).toBeCloseTo(2810, 6);
    expect(world.baseHp.enemy).toBe(3500 - 12);
  });
});

describe('ranged targeting', () => {
  it('hits an enemy within range', () => {
    const world = createWorld();
    const gunner = spawnUnit(world, 'bolt-gunner');
    gunner.x = 1000;
    const rustbot = spawnUnit(world, 'rustbot');
    rustbot.x = 1200;

    step(world);
    expect(rustbot.hp).toBe(150 - 18);
  });

  it('does not hit an enemy out of range', () => {
    const world = createWorld();
    const gunner = spawnUnit(world, 'bolt-gunner');
    gunner.x = 1000;
    const rustbot = spawnUnit(world, 'rustbot');
    rustbot.x = 1300;

    step(world);
    expect(rustbot.hp).toBe(150);
  });

  it('attacks the front-most of several enemies in range', () => {
    const world = createWorld();
    const gunner = spawnUnit(world, 'bolt-gunner');
    gunner.x = 1000;
    const front = spawnUnit(world, 'rustbot');
    front.x = 900;
    const back = spawnUnit(world, 'rustbot');
    back.x = 1100;

    step(world);
    expect(front.hp).toBe(150 - 18);
    expect(back.hp).toBe(150);
  });
});
