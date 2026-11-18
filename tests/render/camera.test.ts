import { describe, expect, it } from 'vitest';
import { updateCamera } from '../../src/render/camera';
import { createWorld, spawnUnit } from '../../src/sim/world';

describe('camera', () => {
  it('never leaves its clamp range', () => {
    const world = createWorld();
    const unit = spawnUnit(world, 'scrapper');
    unit.x = 2050;
    const cam = { x: 0 };
    for (let i = 0; i < 500; i++) updateCamera(cam, world, false);
    expect(cam.x).toBeLessThanOrEqual(1140);
    expect(cam.x).toBeGreaterThanOrEqual(0);
  });

  it('moves toward the front-most player unit', () => {
    const world = createWorld();
    const unit = spawnUnit(world, 'scrapper');
    unit.x = 1500;
    const cam = { x: 0 };
    updateCamera(cam, world, false);
    expect(cam.x).toBeGreaterThan(0);

    const before = cam.x;
    for (let i = 0; i < 50; i++) updateCamera(cam, world, false);
    expect(cam.x).toBeGreaterThan(before);
  });

  it('does not move while dragging', () => {
    const world = createWorld();
    const unit = spawnUnit(world, 'scrapper');
    unit.x = 1500;
    const cam = { x: 100 };
    for (let i = 0; i < 20; i++) updateCamera(cam, world, true);
    expect(cam.x).toBe(100);
  });
});
