import { describe, expect, it } from 'vitest';
import { BASE_X, LANE_MAX } from '../../src/sim/constants';
import { createWorld, spawnUnit } from '../../src/sim/world';
import { MAX_CAMERA_X, VIEW_WIDTH, createCamera, panCamera, updateCamera } from '../../src/render/camera';

const LEAD_OFFSET = VIEW_WIDTH * 0.35;

describe('camera constants', () => {
  it('spans the lane minus one view width', () => {
    expect(VIEW_WIDTH).toBe(960);
    expect(MAX_CAMERA_X).toBe(LANE_MAX - 960);
    expect(MAX_CAMERA_X).toBe(2040);
  });

  it('starts at x = 0', () => {
    expect(createCamera().x).toBe(0);
  });
});

describe('updateCamera', () => {
  it('stays within [0, MAX_CAMERA_X] with units far right', () => {
    const world = createWorld();
    spawnUnit(world, 'scrapper').x = 2990;
    const cam = createCamera();
    for (let i = 0; i < 500; i++) {
      updateCamera(cam, world, false);
      expect(cam.x).toBeGreaterThanOrEqual(0);
      expect(cam.x).toBeLessThanOrEqual(MAX_CAMERA_X);
    }
    expect(cam.x).toBe(MAX_CAMERA_X);
  });

  it('stays within [0, MAX_CAMERA_X] with no units', () => {
    const world = createWorld();
    const cam = { x: 1500 };
    for (let i = 0; i < 500; i++) {
      updateCamera(cam, world, false);
      expect(cam.x).toBeGreaterThanOrEqual(0);
      expect(cam.x).toBeLessThanOrEqual(MAX_CAMERA_X);
    }
  });

  it('moves right toward a front-most player unit, monotonic and without overshoot', () => {
    const world = createWorld();
    spawnUnit(world, 'scrapper').x = 500;
    spawnUnit(world, 'sprinter').x = 2000; // front-most
    const target = 2000 - LEAD_OFFSET;
    const cam = createCamera();
    let prev = cam.x;
    for (let i = 0; i < 200; i++) {
      updateCamera(cam, world, false);
      expect(cam.x).toBeGreaterThanOrEqual(prev);
      expect(cam.x).toBeLessThanOrEqual(target);
      prev = cam.x;
    }
    expect(cam.x).toBe(target);
  });

  it('ignores enemy units when choosing the target', () => {
    const world = createWorld();
    spawnUnit(world, 'scrapper').x = 800;
    spawnUnit(world, 'rustbot').x = 2500;
    const cam = createCamera();
    for (let i = 0; i < 200; i++) updateCamera(cam, world, false);
    expect(cam.x).toBe(800 - LEAD_OFFSET);
  });

  it('moves left when the front-most player unit is behind the camera', () => {
    const world = createWorld();
    spawnUnit(world, 'scrapper').x = 1000;
    const cam = { x: 2000 };
    updateCamera(cam, world, false);
    expect(cam.x).toBeLessThan(2000);
    expect(cam.x).toBeGreaterThanOrEqual(1000 - LEAD_OFFSET);
  });

  it('eases by a tenth of the distance per call', () => {
    const world = createWorld();
    spawnUnit(world, 'scrapper').x = 1000 + LEAD_OFFSET; // target 1000
    const cam = createCamera();
    updateCamera(cam, world, false);
    expect(cam.x).toBeCloseTo(100, 5);
  });

  it('does not move while dragging', () => {
    const world = createWorld();
    spawnUnit(world, 'scrapper').x = 2000;
    const cam = { x: 700 };
    for (let i = 0; i < 50; i++) updateCamera(cam, world, true);
    expect(cam.x).toBe(700);
  });

  it('eases toward the player base side when no player units exist', () => {
    const world = createWorld();
    spawnUnit(world, 'rustbot').x = 2000; // enemy only
    const cam = { x: 1200 };
    let prev = cam.x;
    for (let i = 0; i < 300; i++) {
      updateCamera(cam, world, false);
      expect(cam.x).toBeLessThanOrEqual(prev);
      prev = cam.x;
    }
    expect(cam.x).toBe(Math.max(0, BASE_X.player - LEAD_OFFSET));
    expect(cam.x).toBe(0);
  });
});

describe('panCamera', () => {
  it('moves by dx', () => {
    const cam = { x: 500 };
    panCamera(cam, 120);
    expect(cam.x).toBe(620);
    panCamera(cam, -20);
    expect(cam.x).toBe(600);
  });

  it('clamps at both ends', () => {
    const cam = { x: 100 };
    panCamera(cam, -1000);
    expect(cam.x).toBe(0);
    panCamera(cam, 99999);
    expect(cam.x).toBe(MAX_CAMERA_X);
  });
});
