/** Deterministic pseudo-random in [0, 1) from a number (no Math.random: frames are stable). */
export function hash01(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Whether one skyline window is lit. A pure function of the layer seed, the building's index
 * in world-space tiling, and the window's column/row within that building: it must never see
 * the camera or any screen coordinate, or the lights would flicker while the view scrolls.
 */
export function isWindowLit(layerSeed: number, buildingIndex: number, col: number, row: number): boolean {
  return hash01(buildingIndex * 131 + col * 17 + row * 29 + layerSeed * 7) > 0.82;
}
