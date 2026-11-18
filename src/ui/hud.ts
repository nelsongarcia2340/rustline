import { PLAYER_ROSTER, type UnitDef } from '../data/units';
import type { buildSpriteCache } from '../sprites/cache';
import { canDeploy } from '../sim/economy';
import {
  BASE_MAX_HP,
  ENERGY_CAP,
  ENERGY_REGEN_PER_SEC,
  TICKS_PER_SEC,
} from '../sim/constants';
import type { World } from '../sim/world';

type SpriteCache = ReturnType<typeof buildSpriteCache>;

const ICON_W = 48;
const ICON_H = 40;

/** Number keys that deploy the five roster units, in roster order. */
export const DEPLOY_KEYS = ['1', '2', '3', '4', '5'];

export interface DeployButton {
  def: UnitDef;
  el: HTMLButtonElement;
  fill: HTMLElement;
  /** Last values written to the DOM, so update() only touches what changed. */
  shownDisabled: boolean | null;
  shownCooldownPct: number;
}

export interface Hud {
  /** Refresh the HUD from the world; only writes DOM nodes whose value changed. */
  update(world: World): void;
  buttons: DeployButton[];
  energyFill: HTMLElement;
  energyText: HTMLElement;
  stageLabel: HTMLElement;
  enemyHpFill: HTMLElement;
  enemyHpText: HTMLElement;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function drawIcon(frame: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = el('canvas', 'unit-icon');
  canvas.width = ICON_W;
  canvas.height = ICON_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;
  const scale = Math.max(1, Math.floor(Math.min(ICON_W / frame.width, ICON_H / frame.height)));
  const w = frame.width * scale;
  const h = frame.height * scale;
  ctx.drawImage(frame, Math.floor((ICON_W - w) / 2), ICON_H - h, w, h);
  return canvas;
}

function setText(node: HTMLElement, text: string): void {
  if (node.textContent !== text) node.textContent = text;
}

/**
 * Builds the HUD inside `root` (an element laid out in the canvas's 960x540 space):
 * a top strip (stage label, enemy base HP) and a bottom bar (energy meter, deploy buttons).
 * `onDeploy` is called with a unit id when a button is pressed.
 */
export function createHud(
  root: HTMLElement,
  sprites: SpriteCache,
  onDeploy: (defId: string) => void,
): Hud {
  const top = el('div', 'hud-top');
  const stageLabel = el('div', 'stage-label', 'Stage 1');
  const enemyHp = el('div', 'enemy-hp');
  const enemyHpTitle = el('span', 'enemy-hp-title', 'Enemy base');
  const enemyHpBar = el('div', 'bar bar-enemy');
  const enemyHpFill = el('div', 'bar-fill');
  const enemyHpText = el('span', 'enemy-hp-text');
  enemyHpBar.append(enemyHpFill);
  enemyHp.append(enemyHpTitle, enemyHpBar, enemyHpText);
  top.append(stageLabel, enemyHp);

  const bar = el('div', 'hud-bar');
  const energy = el('div', 'energy');
  const energyHead = el('div', 'energy-head');
  const energyText = el('span', 'energy-text');
  energyHead.append(
    el('span', 'energy-label', 'ENERGY'),
    energyText,
    el('span', 'energy-regen', `+${ENERGY_REGEN_PER_SEC}/s`),
  );
  const energyBar = el('div', 'bar bar-energy');
  const energyFill = el('div', 'bar-fill');
  energyBar.append(energyFill);
  energy.append(energyHead, energyBar);

  const deployRow = el('div', 'deploy-row');
  const buttons: DeployButton[] = PLAYER_ROSTER.map((def, i) => {
    const btn = el('button', 'deploy-btn');
    btn.type = 'button';
    btn.tabIndex = -1;
    btn.dataset.unit = def.id;
    btn.setAttribute('aria-label', `Deploy ${def.name}, cost ${def.cost}`);
    const fill = el('div', 'cooldown-fill');
    const key = el('span', 'key-hint', DEPLOY_KEYS[i]);
    const cost = el('span', 'cost', String(def.cost));
    btn.append(
      fill,
      drawIcon(sprites[def.id].walk1),
      el('span', 'unit-name', def.name),
      cost,
      key,
    );
    // pointerdown fires immediately for mouse, touch and pen (no 300ms click delay).
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!btn.disabled) onDeploy(def.id);
    });
    deployRow.append(btn);
    return { def, el: btn, fill, shownDisabled: null, shownCooldownPct: -1 };
  });

  bar.append(energy, deployRow);
  root.append(top, bar);

  let shownEnergy = -1;
  let shownEnemyHp = -1;
  let shownSeconds = -1;

  function update(world: World): void {
    const e = Math.floor(world.energy);
    if (e !== shownEnergy) {
      shownEnergy = e;
      setText(energyText, `${e} / ${ENERGY_CAP}`);
      energyFill.style.transform = `scaleX(${Math.min(1, world.energy / ENERGY_CAP)})`;
    }

    const hp = Math.max(0, Math.ceil(world.baseHp.enemy));
    if (hp !== shownEnemyHp) {
      shownEnemyHp = hp;
      setText(enemyHpText, `${hp} / ${BASE_MAX_HP.enemy}`);
      enemyHpFill.style.transform = `scaleX(${Math.min(1, hp / BASE_MAX_HP.enemy)})`;
    }

    const seconds = Math.floor(world.tick / TICKS_PER_SEC);
    if (seconds !== shownSeconds) {
      shownSeconds = seconds;
      const mm = Math.floor(seconds / 60);
      const ss = String(seconds % 60).padStart(2, '0');
      setText(stageLabel, `Stage 1 · ${mm}:${ss}`);
    }

    for (const b of buttons) {
      const disabled = !canDeploy(world, b.def.id);
      if (disabled !== b.shownDisabled) {
        b.shownDisabled = disabled;
        b.el.disabled = disabled;
        b.el.classList.toggle('disabled', disabled);
      }
      const total = Math.round(b.def.cooldownSec * TICKS_PER_SEC);
      const remaining = world.cooldowns[b.def.id] ?? 0;
      const pct = total > 0 ? Math.round((Math.max(0, remaining) / total) * 100) : 0;
      if (pct !== b.shownCooldownPct) {
        b.shownCooldownPct = pct;
        b.fill.style.transform = `scaleY(${pct / 100})`;
      }
    }
  }

  return { update, buttons, energyFill, energyText, stageLabel, enemyHpFill, enemyHpText };
}
