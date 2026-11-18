export const STEP_MS = 1000 / 30;
const MAX_TICKS_PER_FRAME = 5;

export function ticksToRun(accumulatorMs: number, dtMs: number): { ticks: number; accumulatorMs: number } {
  let acc = accumulatorMs + dtMs;
  let ticks = Math.floor(acc / STEP_MS);
  acc -= ticks * STEP_MS;

  if (ticks > MAX_TICKS_PER_FRAME) {
    ticks = MAX_TICKS_PER_FRAME;
    acc = 0;
  }

  return { ticks, accumulatorMs: acc };
}
