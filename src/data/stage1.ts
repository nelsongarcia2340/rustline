export interface StageEvent {
  /** Game time, in seconds, at which the enemy unit spawns. */
  atSecond: number;
  /** Enemy unit def id. */
  type: string;
}

/**
 * Enemy timeline for stage 1. Must stay sorted by `atSecond` ascending.
 * Spawns stop at 150s so the lane can clear and the push toward the boss is the finale.
 */
export const STAGE_1: StageEvent[] = [
  // Rustbot trickle
  { atSecond: 6, type: 'rustbot' },
  { atSecond: 12, type: 'rustbot' },
  { atSecond: 18, type: 'rustbot' },
  { atSecond: 24, type: 'rustbot' },
  // Drones join
  { atSecond: 30, type: 'rustbot' },
  { atSecond: 33, type: 'drone' },
  { atSecond: 38, type: 'rustbot' },
  { atSecond: 44, type: 'drone' },
  { atSecond: 50, type: 'rustbot' },
  { atSecond: 56, type: 'drone' },
  // Turret-Walkers join
  { atSecond: 60, type: 'turret-walker' },
  { atSecond: 64, type: 'rustbot' },
  { atSecond: 70, type: 'drone' },
  { atSecond: 75, type: 'rustbot' },
  { atSecond: 80, type: 'turret-walker' },
  { atSecond: 85, type: 'rustbot' },
  { atSecond: 90, type: 'drone' },
  { atSecond: 95, type: 'rustbot' },
  // Siege Tanks join
  { atSecond: 100, type: 'siege-tank' },
  { atSecond: 104, type: 'rustbot' },
  { atSecond: 109, type: 'drone' },
  { atSecond: 114, type: 'rustbot' },
  { atSecond: 120, type: 'turret-walker' },
  { atSecond: 125, type: 'rustbot' },
  { atSecond: 130, type: 'rustbot' },
  { atSecond: 136, type: 'siege-tank' },
  { atSecond: 140, type: 'drone' },
  { atSecond: 145, type: 'rustbot' },
  { atSecond: 150, type: 'rustbot' },
];
