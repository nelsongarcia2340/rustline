import { describe, expect, it } from 'vitest';
import { createDragTracker } from '../../src/ui/drag';

describe('createDragTracker', () => {
  it('starts inactive and move with no active drag returns 0', () => {
    const d = createDragTracker();
    expect(d.active).toBe(false);
    expect(d.move(1, 50)).toBe(0);
  });

  it('start activates the drag and move returns the pan (opposite to the pointer, scaled)', () => {
    const d = createDragTracker();
    expect(d.start(1)).toBe(true);
    expect(d.active).toBe(true);
    expect(d.move(1, 40)).toBe(-40);
    expect(d.move(1, -40, 0.75)).toBe(30);
  });

  it('ignores a second pointer while one drag is active', () => {
    const d = createDragTracker();
    d.start(1);
    expect(d.start(2)).toBe(false);
    expect(d.move(2, 30)).toBe(0);
    expect(d.move(1, 30)).toBe(-30);
  });

  it('end() with the wrong id does not end the drag', () => {
    const d = createDragTracker();
    d.start(1);
    expect(d.end(2)).toBe(false);
    expect(d.active).toBe(true);
    expect(d.end(1)).toBe(true);
    expect(d.active).toBe(false);
    expect(d.move(1, 10)).toBe(0);
  });

  it('end() without an id ends any active drag', () => {
    const d = createDragTracker();
    d.start(5);
    expect(d.end()).toBe(true);
    expect(d.active).toBe(false);
    expect(d.end()).toBe(false);
  });

  it('reset() clears a stuck drag so a new one can start (regression)', () => {
    const d = createDragTracker();
    d.start(1);
    // The pointerup for id 1 is lost; without a reset no new drag could ever start.
    expect(d.start(2)).toBe(false);
    d.reset();
    expect(d.active).toBe(false);
    expect(d.move(1, 20)).toBe(0);
    expect(d.start(2)).toBe(true);
    expect(d.move(2, 20)).toBe(-20);
  });
});
