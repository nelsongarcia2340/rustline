import type { buildSpriteCache } from '../sprites/cache';
import { findTarget } from '../sim/combat';
import { BASE_MAX_HP, BASE_X, TICKS_PER_SEC } from '../sim/constants';
import type { Unit, World } from '../sim/world';
import type { Side } from '../data/units';
import { VIEW_WIDTH, type Camera } from './camera';
import { hash01, isWindowLit } from './skyline';

type SpriteCache = ReturnType<typeof buildSpriteCache>;

export const VIEW_HEIGHT = 540;
/** Y of the lane ground line; sprites stand on it. */
export const GROUND_Y = 430;

const UNIT_SCALE = 3;
const BASE_SCALE = 4;
const BASE_BAR_WIDTH = 120;
const WALK_FRAME_MS = 200;
/** An attack frame is shown for this many ticks after each strike. */
const ATTACK_POSE_TICKS = 6;
const CULL_MARGIN = 40;

const COLORS = {
  skyBands: ['#1b1a33', '#2a2347', '#3d2b55', '#5a3558', '#7d4558', '#a45a52', '#cf7a4c'],
  farSkyline: '#43325f',
  midSkyline: '#241e3b',
  windowLit: '#e8b04a',
  smoke: '#4a3d5c',
  groundTop: '#4b4452',
  groundBody: '#332e3a',
  groundDeep: '#242029',
  groundMark: '#5e566a',
  hpBack: '#14101a',
  hpPlayer: '#5fd36b',
  hpEnemy: '#e0584a',
  hpLow: '#f2c14e',
};

function drawSky(ctx: CanvasRenderingContext2D): void {
  const bands = COLORS.skyBands;
  const h = GROUND_Y / bands.length;
  for (let i = 0; i < bands.length; i++) {
    ctx.fillStyle = bands[i];
    ctx.fillRect(0, Math.floor(i * h), VIEW_WIDTH, Math.ceil(h) + 1);
  }
}

interface SkylineLayer {
  color: string;
  tile: number;
  minH: number;
  maxH: number;
  seed: number;
  chimneys: boolean;
  windows: boolean;
}

const FAR_LAYER: SkylineLayer = {
  color: COLORS.farSkyline, tile: 90, minH: 110, maxH: 250, seed: 11, chimneys: false, windows: false,
};
const MID_LAYER: SkylineLayer = {
  color: COLORS.midSkyline, tile: 150, minH: 50, maxH: 130, seed: 53, chimneys: true, windows: true,
};

/** A repeating skyline of blocks; `parallax` is the fraction of the camera motion it follows. */
function drawSkyline(
  ctx: CanvasRenderingContext2D,
  camX: number,
  parallax: number,
  opts: SkylineLayer,
): void {
  const offset = camX * parallax;
  const first = Math.floor(offset / opts.tile);
  const last = Math.floor((offset + VIEW_WIDTH) / opts.tile);
  for (let i = first; i <= last; i++) {
    const r = hash01(i + opts.seed);
    const h = Math.round(opts.minH + r * (opts.maxH - opts.minH));
    const w = Math.round(opts.tile * (0.6 + 0.35 * hash01(i * 3 + opts.seed)));
    const x = Math.round(i * opts.tile - offset);
    const top = GROUND_Y - h;
    ctx.fillStyle = opts.color;
    ctx.fillRect(x, top, w, h);
    if (opts.chimneys && hash01(i * 7 + opts.seed) > 0.55) {
      const cx = x + Math.round(w * 0.65);
      ctx.fillRect(cx, top - 34, 10, 34);
      ctx.fillStyle = COLORS.smoke;
      ctx.fillRect(cx - 4, top - 48, 18, 10);
      ctx.fillRect(cx + 2, top - 62, 14, 10);
    }
    if (opts.windows) {
      ctx.fillStyle = COLORS.windowLit;
      for (let row = 0, wy = top + 10; wy < GROUND_Y - 12; row++, wy += 18) {
        for (let col = 0, wx = x + 8; wx < x + w - 10; col++, wx += 16) {
          if (isWindowLit(opts.seed, i, col, row)) ctx.fillRect(wx, wy, 4, 6);
        }
      }
    }
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, camX: number): void {
  drawSky(ctx);
  drawSkyline(ctx, camX, 0.2, FAR_LAYER);
  drawSkyline(ctx, camX, 0.5, MID_LAYER);
}

function drawGround(ctx: CanvasRenderingContext2D, camX: number): void {
  ctx.fillStyle = COLORS.groundTop;
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, 6);
  ctx.fillStyle = COLORS.groundBody;
  ctx.fillRect(0, GROUND_Y + 6, VIEW_WIDTH, 40);
  ctx.fillStyle = COLORS.groundDeep;
  ctx.fillRect(0, GROUND_Y + 46, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y - 46);
  // Lane plates scroll 1:1 with the world.
  ctx.fillStyle = COLORS.groundMark;
  const spacing = 80;
  const first = Math.floor(camX / spacing);
  for (let i = first; i <= first + VIEW_WIDTH / spacing + 1; i++) {
    const x = Math.round(i * spacing - camX);
    ctx.fillRect(x, GROUND_Y + 14, 36, 4);
    ctx.fillRect(x + 20, GROUND_Y + 30, 24, 3);
  }
}

function hpColor(ratio: number, side: Side): string {
  if (ratio <= 0.3) return COLORS.hpLow;
  return side === 'player' ? COLORS.hpPlayer : COLORS.hpEnemy;
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  width: number,
  ratio: number,
  side: Side,
  height: number,
): void {
  const x = Math.round(cx - width / 2);
  const y = Math.round(top);
  ctx.fillStyle = COLORS.hpBack;
  ctx.fillRect(x - 1, y - 1, width + 2, height + 2);
  ctx.fillStyle = hpColor(ratio, side);
  ctx.fillRect(x, y, Math.round(width * Math.max(0, Math.min(1, ratio))), height);
}

function drawBase(
  ctx: CanvasRenderingContext2D,
  world: World,
  camX: number,
  sprites: SpriteCache,
  side: Side,
): void {
  const frame = sprites[`base-${side}`].walk1;
  const w = frame.width * BASE_SCALE;
  const h = frame.height * BASE_SCALE;
  const sx = BASE_X[side] - camX;
  if (sx + w / 2 < -CULL_MARGIN || sx - w / 2 > VIEW_WIDTH + CULL_MARGIN) return;
  ctx.drawImage(frame, Math.round(sx - w / 2), GROUND_Y - h, w, h);
  drawHpBar(ctx, sx, GROUND_Y - h - 14, BASE_BAR_WIDTH, world.baseHp[side] / BASE_MAX_HP[side], side, 8);
}

/** White copies of sprite frames, built lazily, used for the hit flash. */
const silhouettes = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

function silhouetteOf(frame: HTMLCanvasElement): HTMLCanvasElement {
  let sil = silhouettes.get(frame);
  if (!sil) {
    sil = document.createElement('canvas');
    sil.width = frame.width;
    sil.height = frame.height;
    const sctx = sil.getContext('2d');
    if (!sctx) throw new Error('2D canvas context unavailable');
    sctx.drawImage(frame, 0, 0);
    sctx.globalCompositeOperation = 'source-atop';
    sctx.fillStyle = '#ffffff';
    sctx.fillRect(0, 0, sil.width, sil.height);
    silhouettes.set(frame, sil);
  }
  return sil;
}

function pickFrame(world: World, u: Unit, sprites: SpriteCache, nowMs: number): HTMLCanvasElement {
  const frames = sprites[u.def.id];
  if (u.staggerTicks > 0) return frames.walk1;
  if (findTarget(world, u)) {
    // Fighting: stand still, striking pose just after each attack.
    const interval = Math.round(u.def.attackIntervalSec * TICKS_PER_SEC);
    return u.attackTimer >= interval - ATTACK_POSE_TICKS ? frames.attack : frames.walk1;
  }
  // Per-unit phase offset keeps a crowd from marching in lockstep.
  return Math.floor((nowMs + u.uid * 70) / WALK_FRAME_MS) % 2 === 0 ? frames.walk1 : frames.walk2;
}

function drawUnit(
  ctx: CanvasRenderingContext2D,
  world: World,
  u: Unit,
  camX: number,
  sprites: SpriteCache,
  nowMs: number,
): void {
  const frame = pickFrame(world, u, sprites, nowMs);
  const w = frame.width * UNIT_SCALE;
  const h = frame.height * UNIT_SCALE;
  const sx = u.x - camX;
  if (sx + w / 2 < -CULL_MARGIN || sx - w / 2 > VIEW_WIDTH + CULL_MARGIN) return;
  const top = GROUND_Y - h;
  const left = Math.round(sx - w / 2);

  ctx.save();
  if (u.def.side === 'enemy') {
    ctx.translate(left + w, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(left, 0);
  }
  ctx.drawImage(frame, 0, top, w, h);
  if (u.staggerTicks > 0) {
    ctx.globalAlpha = 0.75;
    ctx.drawImage(silhouetteOf(frame), 0, top, w, h);
  }
  ctx.restore();

  if (u.hp < u.def.hp) {
    drawHpBar(ctx, sx, top - 8, Math.max(24, Math.round(w * 0.7)), u.hp / u.def.hp, u.def.side, 4);
  }
}

/** Draws one frame of the battle. Read-only on `world`. */
export function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  sprites: SpriteCache,
  nowMs: number,
): void {
  ctx.imageSmoothingEnabled = false;
  drawBackground(ctx, cam.x);
  drawGround(ctx, cam.x);
  drawBase(ctx, world, cam.x, sprites, 'player');
  drawBase(ctx, world, cam.x, sprites, 'enemy');
  for (const u of world.units) drawUnit(ctx, world, u, cam.x, sprites, nowMs);
}
