import { findTarget } from '../sim/combat';
import { BASE_MAX_HP, BASE_X, TICKS_PER_SEC } from '../sim/constants';
import type { Side } from '../data/units';
import type { Unit, World } from '../sim/world';
import type { Effect } from './effects';
import { EFFECT_DURATION_MS } from './effects';
import type { buildSpriteCache } from '../sprites/cache';
import { ENEMY_WEAPON, PLAYER_WEAPON } from '../sprites/palette';
import type { Camera } from './camera';

type SpriteCache = ReturnType<typeof buildSpriteCache>;

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const GROUND_Y = 420;
const EFFECT_Y_OFFSET = 18;

function worldToScreenX(worldX: number, cam: Camera): number {
  return worldX - cam.x;
}

function drawFarRuins(ctx: CanvasRenderingContext2D, cam: Camera): void {
  ctx.fillStyle = '#17173a';
  const period = 320;
  const offset = -(cam.x * 0.1) % period;
  const baseY = GROUND_Y * 0.55;

  for (let i = -1; i <= Math.ceil(CANVAS_WIDTH / period) + 1; i++) {
    const x = offset + i * period;
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y);
    ctx.lineTo(x + period * 0.15, baseY - 40);
    ctx.lineTo(x + period * 0.3, GROUND_Y);
    ctx.lineTo(x + period * 0.45, baseY - 70);
    ctx.lineTo(x + period * 0.6, GROUND_Y);
    ctx.lineTo(x + period * 0.8, baseY - 30);
    ctx.lineTo(x + period, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawMidRuins(ctx: CanvasRenderingContext2D, cam: Camera): void {
  ctx.fillStyle = '#242450';
  const period = 180;
  const offset = -(cam.x * 0.3) % period;
  const baseY = GROUND_Y * 0.8;

  for (let i = -1; i <= Math.ceil(CANVAS_WIDTH / period) + 1; i++) {
    const x = offset + i * period;
    ctx.fillRect(x, baseY - 20, period * 0.35, GROUND_Y - (baseY - 20));
    ctx.fillRect(x + period * 0.45, baseY - 50, period * 0.3, GROUND_Y - (baseY - 50));
    ctx.fillRect(x + period * 0.8, baseY - 10, period * 0.15, GROUND_Y - (baseY - 10));
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#0d0d1f');
  sky.addColorStop(1, '#2a2a52');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

  drawFarRuins(ctx, cam);
  drawMidRuins(ctx, cam);
}

function drawGround(ctx: CanvasRenderingContext2D, cam: Camera): void {
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

  ctx.fillStyle = '#343434';
  const plateWidth = 60;
  const offset = -(cam.x % (plateWidth * 2));
  for (let x = offset - plateWidth * 2; x < CANVAS_WIDTH + plateWidth * 2; x += plateWidth * 2) {
    ctx.fillRect(x, GROUND_Y, plateWidth, CANVAS_HEIGHT - GROUND_Y);
  }

  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 3);
}

function drawHpBar(ctx: CanvasRenderingContext2D, centerX: number, y: number, ratio: number, width: number): void {
  ctx.fillStyle = '#222222';
  ctx.fillRect(centerX - width / 2, y, width, 5);
  ctx.fillStyle = ratio > 0.3 ? '#4caf50' : '#e53935';
  ctx.fillRect(centerX - width / 2, y, width * Math.max(0, Math.min(1, ratio)), 5);
}

function drawBase(ctx: CanvasRenderingContext2D, world: World, cam: Camera, side: Side, sprites: SpriteCache): void {
  const screenX = worldToScreenX(BASE_X[side], cam);
  if (screenX < -80 || screenX > CANVAS_WIDTH + 80) {
    return;
  }

  const sprite = sprites[`base-${side}`].walk1;
  const drawX = screenX - sprite.width / 2;
  const drawY = GROUND_Y - sprite.height;
  ctx.drawImage(sprite, drawX, drawY);

  const ratio = world.baseHp[side] / BASE_MAX_HP[side];
  drawHpBar(ctx, screenX, drawY - 10, ratio, sprite.width);
}

function drawUnit(
  ctx: CanvasRenderingContext2D,
  world: World,
  unit: Unit,
  cam: Camera,
  sprites: SpriteCache,
  nowMs: number,
): void {
  const screenX = worldToScreenX(unit.x, cam);
  if (screenX < -40 || screenX > CANVAS_WIDTH + 40) {
    return;
  }

  const frameSet = sprites[unit.def.id];
  const target = findTarget(world, unit);
  const cooldownTicks = Math.round(unit.def.attackIntervalSec * TICKS_PER_SEC);
  const justAttacked = unit.attackTimer > cooldownTicks - 6;

  let frame;
  if (target && justAttacked) {
    frame = frameSet.attack;
  } else if (target) {
    frame = frameSet.walk1;
  } else {
    frame = Math.floor(nowMs / 200) % 2 === 0 ? frameSet.walk1 : frameSet.walk2;
  }

  const flip = unit.def.side === 'enemy';
  const drawY = GROUND_Y - frame.height;

  ctx.save();
  if (flip) {
    ctx.translate(screenX, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, -frame.width / 2, drawY);
  } else {
    ctx.drawImage(frame, screenX - frame.width / 2, drawY);
  }
  ctx.restore();

  if (unit.staggerTicks > 7) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX - frame.width / 2, drawY, frame.width, frame.height);
    ctx.restore();
  }

  drawHpBar(ctx, screenX, drawY - 8, unit.hp / unit.def.hp, frame.width);
}

function drawEffects(ctx: CanvasRenderingContext2D, cam: Camera, effects: Effect[], nowMs: number): void {
  const y = GROUND_Y - EFFECT_Y_OFFSET;

  for (const effect of effects) {
    const duration = EFFECT_DURATION_MS[effect.kind];
    const progress = Math.max(0, Math.min(1, (nowMs - effect.startMs) / duration));
    const color = effect.side === 'player' ? PLAYER_WEAPON : ENEMY_WEAPON;

    if (effect.kind === 'projectile') {
      const fromScreen = worldToScreenX(effect.fromX, cam);
      const toScreen = worldToScreenX(effect.toX, cam);
      const x = fromScreen + (toScreen - fromScreen) * progress;

      ctx.save();
      ctx.globalAlpha = 1 - progress * 0.3;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - (toScreen - fromScreen) * 0.08, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    const screenX = worldToScreenX(effect.toX, cam);
    const maxRadius = effect.kind === 'burst' ? 26 : 12;
    const radius = maxRadius * progress;

    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = color;
    ctx.lineWidth = effect.kind === 'burst' ? 3 : 2;
    ctx.beginPath();
    ctx.arc(screenX, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    if (effect.kind === 'burst') {
      ctx.beginPath();
      ctx.arc(screenX, y, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  sprites: SpriteCache,
  nowMs: number,
  effects: Effect[],
): void {
  ctx.imageSmoothingEnabled = false;
  drawBackground(ctx, cam);
  drawGround(ctx, cam);
  drawBase(ctx, world, cam, 'player', sprites);
  drawBase(ctx, world, cam, 'enemy', sprites);
  for (const unit of world.units) {
    drawUnit(ctx, world, unit, cam, sprites, nowMs);
  }
  drawEffects(ctx, cam, effects, nowMs);
}
