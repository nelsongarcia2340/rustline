import { SPRITES } from './defs';
import type { SpriteDef, SpriteFrameName } from './types';

export type SpriteFrames = Record<SpriteFrameName, HTMLCanvasElement>;

const FRAME_NAMES: SpriteFrameName[] = ['walk1', 'walk2', 'attack'];

function renderFrame(def: SpriteDef, rows: string[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = rows[0].length;
  canvas.height = rows.length;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      ctx.fillStyle = def.palette[ch];
      ctx.fillRect(x, y, 1, 1);
    }
  });
  return canvas;
}

/**
 * Renders every sprite frame once to an offscreen canvas at 1 pixel per grid cell.
 * The renderer scales these up with image smoothing disabled.
 */
export function buildSpriteCache(): Record<string, SpriteFrames> {
  const cache: Record<string, SpriteFrames> = {};
  for (const [id, def] of Object.entries(SPRITES)) {
    const frames = {} as SpriteFrames;
    for (const name of FRAME_NAMES) frames[name] = renderFrame(def, def.frames[name]);
    cache[id] = frames;
  }
  return cache;
}
