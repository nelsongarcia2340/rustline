import { describe, expect, it } from 'vitest';
import { createWorld, spawnUnit, step } from '../../src/sim/world';

describe('attack events', () => {
  it('pushes one event for a non-lethal hit', () => {
    const world = createWorld();
    const gunner = spawnUnit(world, 'bolt-gunner');
    gunner.x = 1000;
    const rustbot = spawnUnit(world, 'rustbot');
    rustbot.x = 1200;

    step(world);

    expect(world.events).toHaveLength(1);
    expect(world.events[0]).toEqual({
      attackerSide: 'player',
      attackerX: 1000,
      targetX: 1200,
      range: 220,
      splashRadius: 0,
      killed: false,
    });
  });

  it('marks the event killed when the hit is lethal', () => {
    const world = createWorld();
    const gunner = spawnUnit(world, 'bolt-gunner');
    gunner.x = 1000;
    const rustbot = spawnUnit(world, 'rustbot');
    rustbot.x = 1200;
    rustbot.hp = 10;

    step(world);

    expect(world.events).toHaveLength(1);
    expect(world.events[0].killed).toBe(true);
  });

  it('pushes exactly one event for a splash attack, even when it kills several units', () => {
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

    expect(world.events).toHaveLength(1);
    expect(world.events[0]).toMatchObject({
      attackerSide: 'player',
      attackerX: 1000,
      targetX: a.x,
      range: 90,
      splashRadius: 90,
      killed: true,
    });
  });
});
