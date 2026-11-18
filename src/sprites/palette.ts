/** Parse a `#rrggbb` colour into `[r, g, b]` (0-255). */
export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Expected #rrggbb colour, got "${hex}"`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/** Neutral colours shared by sprites on both sides. */
export const NEUTRAL = {
  gunmetal: '#6b7886',
  darkMetal: '#2b333c',
  joint: '#4a5a66',
  steel: '#aab8c4',
  flash: '#ffcf3a',
  flashCore: '#fff3a8',
  flame: '#ff9a2e',
  eyeYellow: '#ffe066',
} as const;
