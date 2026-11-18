import type { Camera } from './render/camera';
import { updateCamera } from './render/camera';
import { createEffectsTracker } from './render/effects';
import { drawWorld } from './render/renderer';
import { buildSpriteCache } from './sprites/cache';
import type { World } from './sim/world';
import { createWorld, step } from './sim/world';
import { createHud } from './ui/hud';
import { attachDragPan } from './ui/input';
import { ticksToRun } from './ui/loop';
import { createOverlay } from './ui/overlay';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const ctx = canvas.getContext('2d')!;
const app = document.querySelector<HTMLDivElement>('#app')!;

let world: World = createWorld();
const sprites = buildSpriteCache();
const camera: Camera = { x: 0 };
const dragState = { manual: false };
const effects = createEffectsTracker();

const SHAKE_DURATION_MS = 180;
const SHAKE_MAGNITUDE = 6;
let shakeStartMs = -Infinity;

const hud = createHud(app, () => world);
const overlay = createOverlay(app, (freshWorld) => {
  world = freshWorld;
  camera.x = 0;
  dragState.manual = false;
});

attachDragPan(canvas, camera, dragState);

function resizeCanvas(): void {
  const aspect = 960 / 540;
  let width = window.innerWidth;
  let height = window.innerHeight;
  if (width / height > aspect) {
    width = height * aspect;
  } else {
    height = width / aspect;
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

if (import.meta.env.DEV) {
  (window as unknown as { __game: unknown }).__game = {
    world: () => world,
  };
}

let accumulatorMs = 0;
let lastTime = performance.now();

function frame(now: number): void {
  const dt = now - lastTime;
  lastTime = now;

  const result = ticksToRun(accumulatorMs, dt);
  accumulatorMs = result.accumulatorMs;
  for (let i = 0; i < result.ticks; i++) step(world);

  if (world.events.some((event) => event.killed)) {
    shakeStartMs = now;
  }
  effects.absorb(world.events, now);
  world.events = [];

  updateCamera(camera, world, dragState.manual);

  const shakeElapsed = now - shakeStartMs;
  const shakeDecay = Math.max(0, 1 - shakeElapsed / SHAKE_DURATION_MS);
  const shakeX = (Math.random() * 2 - 1) * SHAKE_MAGNITUDE * shakeDecay;
  const renderCamera: Camera = { x: camera.x + shakeX };

  ctx.imageSmoothingEnabled = false;
  drawWorld(ctx, world, renderCamera, sprites, now, effects.active(now));
  hud.update(world);
  overlay.update(world);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
