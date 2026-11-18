import { describe, expect, it } from 'vitest';
import { applyDamage } from '../../src/sim/combat';
import { createWorld, spawnUnit, step } from '../../src/sim/world';

describe('knockback thresholds', () => {
  it('knocks back and staggers a unit when a hit crosses a third of its max hp', () => {
    const world = createWorld();
    const scrapper = spawnUnit(world, 'scrapper');
    scrapper.x = 1000;

    applyDamage(world, scrapper, 50);

    expect(scrapper.hp).toBe(70);
    expect(scrapper.kbStage).toBe(1);
    expect(scrapper.staggerTicks).toBe(10);
    expect(scrapper.x).toBeCloseTo(960, 6);
  });

  it('treats a hit that crosses two thresholds as a single knockback', () => {
    const world = createWorld();
    const scrapper = spawnUnit(world, 'scrapper');
    scrapper.x = 1000;

    applyDamage(world, scrapper, 90);

    expect(scrapper.hp).toBe(30);
    expect(scrapper.kbStage).toBe(2);
    expect(scrapper.staggerTicks).toBe(10);
    expect(scrapper.x).toBeCloseTo(960, 6);
  });

  it('clamps knockback so a player unit is never pushed behind its own base', () => {
    const world = createWorld();
    const scrapper = spawnUnit(world, 'scrapper');
    scrapper.x = 120;

    applyDamage(world, scrapper, 90);

    expect(scrapper.x).toBe(100);
  });

  it('clamps knockback so an enemy unit is never pushed behind its own base', () => {
    const world = createWorld();
    const rustbot = spawnUnit(world, 'rustbot');
    rustbot.x = 2880;

    applyDamage(world, rustbot, 60);

    expect(rustbot.x).toBe(2900);
  });
});

describe('stagger', () => {
  it('freezes movement for the stagger duration, then resumes', () => {
    const world = createWorld();
    const scrapper = spawnUnit(world, 'scrapper');
    scrapper.x = 1000;
    scrapper.staggerTicks = 10;

    for (let i = 0; i < 10; i++) step(world);
    expect(scrapper.x).toBe(1000);
    expect(scrapper.staggerTicks).toBe(0);

    step(world);
    expect(scrapper.x).toBeCloseTo(1002, 6);
  });

  it('does not attack while staggered even with a target in range', () => {
    const world = createWorld();
    const scrapper = spawnUnit(world, 'scrapper');
    scrapper.x = 1000;
    scrapper.staggerTicks = 5;
    const rustbot = spawnUnit(world, 'rustbot');
    rustbot.x = 1010;

    for (let i = 0; i < 5; i++) step(world);
    expect(rustbot.hp).toBe(150);
    expect(scrapper.x).toBe(1000);

    step(world);
    expect(rustbot.hp).toBe(150 - 12);
  });
});

describe('splash and death', () => {
  it('splashes damage around the primary target and removes dead units cleanly', () => {
    const world = createWorld();
    const titan = spawnUnit(world, 'titan');
    titan.x = 1000;
    const a = spawnUnit(world, 'rustbot');
    a.x = 1010;
    a.hp = 50;
    const b = spawnUnit(world, 'rustbot');
    b.x = 1015;
    b.hp = 50;
    const c = spawnUnit(world, 'rustbot');
    c.x = 1020;
    c.hp = 50;
    const d = spawnUnit(world, 'rustbot');
    d.x = 1110;
    d.hp = 150;

    step(world);

    expect(world.units).not.toContain(a);
    expect(world.units).not.toContain(b);
    expect(world.units).not.toContain(c);
    expect(world.units).toContain(d);
    expect(d.hp).toBe(150);
  });
});
