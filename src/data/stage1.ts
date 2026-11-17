export interface StageEvent {
  /** Game time, in seconds, at which the enemy unit spawns. */
  atSecond: number;
  /** Enemy unit def id. */
  type: string;
}

/**
 * Enemy timeline for stage 1. Must stay sorted by `atSecond` ascending.
 *
 * Deliberately light: a Rustbot every 12s plus a Drone every 20s from 40s. Turret-Walkers and Siege
 * Tanks are left out for now because the greedy scrapper-heavy headless strategy cannot beat them
 * (see the Task 6 report); add them back once the economy/boss balance is revisited.
 */
export const STAGE_1: StageEvent[] = [
  { atSecond: 10, type: 'rustbot' },
  { atSecond: 22, type: 'rustbot' },
  { atSecond: 34, type: 'rustbot' },
  { atSecond: 40, type: 'drone' },
  { atSecond: 46, type: 'rustbot' },
  { atSecond: 58, type: 'rustbot' },
  { atSecond: 60, type: 'drone' },
  { atSecond: 70, type: 'rustbot' },
  { atSecond: 80, type: 'drone' },
  { atSecond: 82, type: 'rustbot' },
  { atSecond: 94, type: 'rustbot' },
  { atSecond: 100, type: 'drone' },
  { atSecond: 106, type: 'rustbot' },
  { atSecond: 118, type: 'rustbot' },
];
