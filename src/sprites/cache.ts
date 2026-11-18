import { SPRITES } from './defs';

type FrameName = 'walk1' | 'walk2' | 'attack';

function rasterize(rows: string[], palette: Record<string, string>): HTMLCanvasElement {
  const height = rows.length;
  const width = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x];
      const idx = (y * width + x) * 4;
      if (ch === '.') {
        image.data[idx + 3] = 0;
        continue;
      }
      const hex = palette[ch];
      image.data[idx] = parseInt(hex.slice(1, 3), 16);
      image.data[idx + 1] = parseInt(hex.slice(3, 5), 16);
      image.data[idx + 2] = parseInt(hex.slice(5, 7), 16);
      image.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function buildSpriteCache(): Record<string, Record<FrameName, HTMLCanvasElement>> {
  const cache: Record<string, Record<FrameName, HTMLCanvasElement>> = {};
  for (const [id, sprite] of Object.entries(SPRITES)) {
    cache[id] = {
      walk1: rasterize(sprite.frames.walk1, sprite.palette),
      walk2: rasterize(sprite.frames.walk2, sprite.palette),
      attack: rasterize(sprite.frames.attack, sprite.palette),
    };
  }
  return cache;
}
