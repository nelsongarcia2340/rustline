import { describe, it, expect } from 'vitest';
import { createWorld, step } from '../../src/sim/world';
import { canDeploy, deploy } from '../../src/sim/economy';
import { ENERGY_CAP } from '../../src/sim/constants';

function run(world: ReturnType<typeof createWorld>, ticks: number): void {
  for (let i = 0; i < ticks; i++) step(world);
}

describe('energy regen', () => {
  it('adds 12 energy per second: 90 idle ticks from 100 gives 136', () => {
    const w = createWorld();
    run(w, 90);
    expect(w.energy).toBeCloseTo(136, 6);
  });

  it('caps at 600', () => {
    const w = createWorld();
    w.energy = 599.9;
    run(w, 100);
    expect(w.energy).toBe(ENERGY_CAP);
    expect(ENERGY_CAP).toBe(600);
  });
});

describe('deploy', () => {
  it('succeeds with energy exactly equal to cost and spends it', () => {
    const w = createWorld();
    w.energy = 50;
    expect(canDeploy(w, 'scrapper')).toBe(true);
    expect(deploy(w, 'scrapper')).toBe(true);
    expect(w.energy).toBe(0);
    expect(w.units).toHaveLength(1);
    expect(w.units[0].def.id).toBe('scrapper');
    expect(w.units[0].x).toBe(160);
  });

  it('is refused with insufficient energy and changes nothing', () => {
    const w = createWorld();
    w.energy = 49;
    expect(canDeploy(w, 'scrapper')).toBe(false);
    expect(deploy(w, 'scrapper')).toBe(false);
    expect(w.energy).toBe(49);
    expect(w.units).toHaveLength(0);
    expect(w.cooldowns).toEqual({});
  });

  it('is refused during cooldown and allowed again after 60 ticks', () => {
    const w = createWorld();
    w.energy = 500;
    expect(deploy(w, 'scrapper')).toBe(true);
    expect(w.cooldowns['scrapper']).toBe(60);

    const energyBefore = w.energy;
    const unitsBefore = w.units.length;
    expect(canDeploy(w, 'scrapper')).toBe(false);
    expect(deploy(w, 'scrapper')).toBe(false);
    expect(w.energy).toBe(energyBefore);
    expect(w.units).toHaveLength(unitsBefore);
    expect(w.cooldowns['scrapper']).toBe(60);

    run(w, 59);
    expect(deploy(w, 'scrapper')).toBe(false);
    step(w); // 60th step
    expect(canDeploy(w, 'scrapper')).toBe(true);
    expect(deploy(w, 'scrapper')).toBe(true);
    expect(w.units).toHaveLength(2);
  });

  it('cooldowns are per unit type', () => {
    const w = createWorld();
    w.energy = 500;
    expect(deploy(w, 'scrapper')).toBe(true);
    expect(deploy(w, 'bolt-gunner')).toBe(true);
    expect(w.cooldowns['bolt-gunner']).toBe(120);
  });

  it.each(['won', 'lost'] as const)('is refused after game over (%s) and changes nothing', (status) => {
    const w = createWorld();
    w.energy = 500;
    w.status = status;
    expect(canDeploy(w, 'scrapper')).toBe(false);
    expect(deploy(w, 'scrapper')).toBe(false);
    expect(w.energy).toBe(500);
    expect(w.units).toHaveLength(0);
    expect(w.cooldowns).toEqual({});
  });

  it('refuses enemy unit ids', () => {
    const w = createWorld();
    w.energy = 500;
    expect(canDeploy(w, 'rustbot')).toBe(false);
    expect(deploy(w, 'rustbot')).toBe(false);
    expect(w.units).toHaveLength(0);
    expect(w.energy).toBe(500);
  });
});
