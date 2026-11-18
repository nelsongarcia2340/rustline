import './style.css';
import { PLAYER_ROSTER } from './data/units';
import { createCamera, updateCamera, VIEW_WIDTH } from './render/camera';
import { drawWorld, VIEW_HEIGHT } from './render/renderer';
import { createWorld, step } from './sim/world';
import { deploy } from './sim/economy';
import { buildSpriteCache } from './sprites/cache';
import { createHud } from './ui/hud';
import { createInput } from './ui/input';
import { ticksToRun } from './ui/loop';
import { createOverlay } from './ui/overlay';

function requireElement<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id} element`);
  return node as T;
}

const canvas = requireElement<HTMLCanvasElement>('game');
const hudRoot = requireElement('hud');
const appRoot = requireElement('app');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;
const ctxOrNull = canvas.getContext('2d');
if (!ctxOrNull) throw new Error('2D canvas context unavailable');
const ctx: CanvasRenderingContext2D = ctxOrNull;

const sprites = buildSpriteCache();
let world = createWorld();
let cam = createCamera();
let accumulatorMs = 0;
let lastTs: number | null = null;

function onDeploy(id: string): void {
  deploy(world, id);
  hud.update(world);
}

const hud = createHud(hudRoot, sprites, onDeploy);

const overlay = createOverlay(appRoot, () => {
  world = createWorld();
  cam = createCamera();
  accumulatorMs = 0;
  input.reset();
  hud.update(world);
  overlay.update(world.status);
});

const input = createInput({
  canvas,
  getCamera: () => cam,
  onDeployIndex: (i) => onDeploy(PLAYER_ROSTER[i].id),
});

function frame(ts: number): void {
  // Schedule first so one thrown frame cannot kill the loop.
  requestAnimationFrame(frame);
  const dt = lastTs === null || document.hidden ? 0 : ts - lastTs;
  lastTs = document.hidden ? null : ts;
  const run = ticksToRun(accumulatorMs, dt);
  accumulatorMs = run.accumulatorMs;
  for (let i = 0; i < run.ticks; i++) step(world);
  updateCamera(cam, world, input.state.dragging);
  drawWorld(ctx, world, cam, sprites, ts);
  hud.update(world);
  overlay.update(world.status);
}

if (import.meta.env.DEV) {
  window.__game = {
    get world() {
      return world;
    },
    get camera() {
      return cam;
    },
    deploy: (id) => deploy(world, id),
    step: (n = 1) => {
      for (let i = 0; i < n; i++) step(world);
    },
  };
}

requestAnimationFrame(frame);
