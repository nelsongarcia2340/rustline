import { describe, expect, it } from 'vitest';
import { ticksToRun } from '../../src/ui/loop';

describe('ticksToRun', () => {
  it('runs 3 ticks for a 100ms frame from a fresh accumulator', () => {
    const result = ticksToRun(0, 100);
    expect(result.ticks).toBe(3);
  });

  it('caps a huge frame at 5 ticks and drops the leftover', () => {
    const result = ticksToRun(0, 5000);
    expect(result.ticks).toBe(5);
    expect(result.accumulatorMs).toBe(0);
  });

  it('carries the accumulator remainder between frames when under the cap', () => {
    const first = ticksToRun(0, 20);
    expect(first.ticks).toBe(0);
    expect(first.accumulatorMs).toBeCloseTo(20, 6);

    const second = ticksToRun(first.accumulatorMs, 20);
    expect(second.ticks).toBe(1);
    expect(second.accumulatorMs).toBeCloseTo(40 - 1000 / 30, 6);
  });
});
