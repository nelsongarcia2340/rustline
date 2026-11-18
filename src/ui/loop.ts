import { TICKS_PER_SEC } from '../sim/constants';

/** Fixed simulation step, in milliseconds. */
export const STEP_MS = 1000 / TICKS_PER_SEC;
/** Most ticks run in a single frame; any further backlog is dropped (spiral-of-death guard). */
export const MAX_TICKS_PER_FRAME = 5;

/**
 * Decide how many fixed sim ticks to run for a frame that took `dtMs`, carrying
 * the leftover time in `accumulatorMs`. Beyond the cap the leftover is discarded.
 */
export function ticksToRun(
  accumulatorMs: number,
  dtMs: number,
): { ticks: number; accumulatorMs: number } {
  const dt = Number.isFinite(dtMs) && dtMs > 0 ? dtMs : 0;
  const acc = (Number.isFinite(accumulatorMs) && accumulatorMs > 0 ? accumulatorMs : 0) + dt;
  const ticks = Math.floor(acc / STEP_MS);
  if (ticks > MAX_TICKS_PER_FRAME) return { ticks: MAX_TICKS_PER_FRAME, accumulatorMs: 0 };
  return { ticks, accumulatorMs: acc - ticks * STEP_MS };
}
