import { describe, expect, it } from 'vitest';
import { canDeploy, deploy } from '../../src/sim/economy';
import { createWorld, step } from '../../src/sim/world';

describe('energy regen', () => {
  it('regenerates 24 per second, capped at 600', () => {
    const world = createWorld();
    for (let i = 0; i < 90; i++) step(world);
    expect(world.energy).toBeCloseTo(172, 6);
  });

  it('never exceeds the energy cap', () => {
    const world = createWorld();
    world.energy = 599;
    for (let i = 0; i < 30; i++) step(world);
    expect(world.energy).toBe(600);
  });
});

describe('deploy', () => {
  it('succeeds when energy exactly covers the cost, spending it all', () => {
    const world = createWorld();
    world.energy = 50;
    expect(deploy(world, 'scrapper')).toBe(true);
    expect(world.energy).toBe(0);
    expect(world.units).toHaveLength(1);
  });

  it('fails and changes nothing when energy is one short', () => {
    const world = createWorld();
    world.energy = 49;
    expect(deploy(world, 'scrapper')).toBe(false);
    expect(world.energy).toBe(49);
    expect(world.units).toHaveLength(0);
  });

  it('refuses a redeploy during cooldown, then allows it once cooldown passes', () => {
    const world = createWorld();
    world.energy = 200;

    expect(deploy(world, 'scrapper')).toBe(true);
    expect(canDeploy(world, 'scrapper')).toBe(false);
    expect(deploy(world, 'scrapper')).toBe(false);
    expect(world.units).toHaveLength(1);

    for (let i = 0; i < 60; i++) step(world);

    expect(canDeploy(world, 'scrapper')).toBe(true);
    expect(deploy(world, 'scrapper')).toBe(true);
    expect(world.units).toHaveLength(2);
  });

  it('refuses to deploy and changes nothing once the game is over', () => {
    const world = createWorld();
    world.energy = 200;
    world.status = 'won';

    expect(deploy(world, 'scrapper')).toBe(false);
    expect(world.energy).toBe(200);
    expect(world.units).toHaveLength(0);
  });
});
