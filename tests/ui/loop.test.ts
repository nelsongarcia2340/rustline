import { describe, expect, it } from 'vitest';
import { MAX_TICKS_PER_FRAME, STEP_MS, ticksToRun } from '../../src/ui/loop';

describe('ticksToRun', () => {
  it('runs 3 ticks for a 100ms frame', () => {
    const r = ticksToRun(0, 100);
    expect(r.ticks).toBe(3);
    expect(r.accumulatorMs).toBeCloseTo(100 - 3 * STEP_MS, 5);
  });

  it('caps a huge frame at 5 ticks and drops the leftover', () => {
    const r = ticksToRun(0, 5000);
    expect(r.ticks).toBe(MAX_TICKS_PER_FRAME);
    expect(r.ticks).toBe(5);
    expect(r.accumulatorMs).toBe(0);
  });

  it('carries the remainder between frames when under the cap', () => {
    const first = ticksToRun(0, 20);
    expect(first.ticks).toBe(0);
    expect(first.accumulatorMs).toBeCloseTo(20, 5);
    const second = ticksToRun(first.accumulatorMs, 20);
    expect(second.ticks).toBe(1);
    expect(second.accumulatorMs).toBeCloseTo(6.67, 2);
  });

  it('treats negative and NaN dt as 0', () => {
    expect(ticksToRun(10, -50)).toEqual({ ticks: 0, accumulatorMs: 10 });
    expect(ticksToRun(10, NaN)).toEqual({ ticks: 0, accumulatorMs: 10 });
  });
});
