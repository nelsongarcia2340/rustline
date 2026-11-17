import { describe, it, expect } from 'vitest';
import { createWorld, spawnUnit, step } from '../../src/sim/world';
import { applyDamage } from '../../src/sim/combat';
import { BASE_X, LANE_MAX, LANE_MIN } from '../../src/sim/constants';

describe('knockback', () => {
  it('knocks a 120 HP unit back 40 units with 10 stagger ticks when hit for 50', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 500;
    applyDamage(w, s, 50); // 70 hp left, crossed the 80 line
    expect(s.hp).toBe(70);
    expect(s.x).toBe(460);
    expect(s.staggerTicks).toBe(10);
    expect(s.kbStage).toBe(1);
  });

  it('knocks enemy units toward +x', () => {
    const w = createWorld();
    const r = spawnUnit(w, 'rustbot');
    r.x = 1500;
    applyDamage(w, r, 60); // 90 <= 100
    expect(r.x).toBe(1540);
  });

  it('does not knock back when no threshold is crossed', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 500;
    applyDamage(w, s, 30); // 90 hp, above 80
    expect(s.x).toBe(500);
    expect(s.staggerTicks).toBe(0);
    expect(s.kbStage).toBe(0);
  });

  it('knocks back once per threshold stage', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 500;
    applyDamage(w, s, 50); // 70 -> stage 1
    applyDamage(w, s, 10); // 60, still stage 1
    expect(s.x).toBe(460);
    applyDamage(w, s, 30); // 30 <= 40 -> stage 2
    expect(s.x).toBe(420);
    expect(s.kbStage).toBe(2);
  });

  it('one big hit crossing two thresholds causes a single knockback', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 500;
    applyDamage(w, s, 100); // 20 hp, crossed both lines
    expect(s.x).toBe(460);
    expect(s.kbStage).toBe(2);
    expect(s.staggerTicks).toBe(10);
    applyDamage(w, s, 5); // no new threshold
    expect(s.x).toBe(460);
  });

  it('does not knock back on a killing blow', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 500;
    applyDamage(w, s, 500);
    expect(s.x).toBe(500);
    expect(s.staggerTicks).toBe(0);
  });

  it('a staggered unit neither moves nor attacks for 10 ticks, then resumes', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 500;
    const r = spawnUnit(w, 'rustbot');
    r.x = 520; // in range 30
    applyDamage(w, s, 50);
    expect(s.x).toBe(460); // now 60 from rustbot, out of range
    const x0 = s.x;
    for (let i = 0; i < 10; i++) {
      step(w);
      expect(s.x).toBe(x0);
    }
    expect(s.staggerTicks).toBe(0);
    step(w);
    expect(s.x).toBeGreaterThan(x0);
  });

  it('a staggered unit does not attack even with a target in range', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 500;
    const r = spawnUnit(w, 'rustbot');
    r.x = 510;
    s.staggerTicks = 10;
    for (let i = 0; i < 10; i++) step(w);
    expect(r.hp).toBe(150); // staggered scrapper never hit back
    expect(s.hp).toBeLessThan(120); // while the rustbot did hit it
  });

  it("a staggered unit's attack timer still counts down", () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 500;
    s.attackTimer = 5;
    s.staggerTicks = 10;
    step(w);
    expect(s.attackTimer).toBe(4);
    step(w);
    expect(s.attackTimer).toBe(3);
  });

  it('clamps a player unit knocked back past its base to BASE_X.player', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 105;
    applyDamage(w, s, 50);
    expect(s.x).toBe(BASE_X.player);
    expect(s.x).toBeGreaterThanOrEqual(LANE_MIN);
  });

  it('clamps an enemy unit knocked back past its base to BASE_X.enemy', () => {
    const w = createWorld();
    const r = spawnUnit(w, 'rustbot');
    r.x = 2895;
    applyDamage(w, r, 60);
    expect(r.x).toBe(BASE_X.enemy);
    expect(r.x).toBeLessThanOrEqual(LANE_MAX);
  });

  it('keeps every unit inside the lane through repeated knockbacks', () => {
    const w = createWorld();
    const a = spawnUnit(w, 'bulwark');
    a.x = 110;
    const b = spawnUnit(w, 'siege-tank');
    b.x = 2890;
    for (let i = 0; i < 20; i++) {
      applyDamage(w, a, 40);
      applyDamage(w, b, 40);
      expect(a.x).toBeGreaterThanOrEqual(BASE_X.player);
      expect(b.x).toBeLessThanOrEqual(BASE_X.enemy);
      for (const u of [a, b]) {
        expect(u.x).toBeGreaterThanOrEqual(LANE_MIN);
        expect(u.x).toBeLessThanOrEqual(LANE_MAX);
      }
    }
  });
});

describe('death removal', () => {
  it('removes dead units at the end of step', () => {
    const w = createWorld();
    const s = spawnUnit(w, 'scrapper');
    s.x = 500;
    const r = spawnUnit(w, 'rustbot');
    r.x = 510;
    r.hp = 1;
    step(w);
    expect(w.units).toEqual([s]);
  });

  it('same-tick exchanges are simultaneous regardless of unit order', () => {
    for (const playerFirst of [true, false]) {
      const w = createWorld();
      const a = spawnUnit(w, 'scrapper');
      const b = spawnUnit(w, 'rustbot');
      a.x = 1000;
      b.x = 1010;
      a.hp = 1;
      b.hp = 1;
      if (!playerFirst) w.units.reverse();
      step(w);
      expect(w.units).toEqual([]);
    }
  });
});

describe('splash', () => {
  it('a Titan hit kills three clustered enemies and spares one 100 units away', () => {
    const w = createWorld();
    const t = spawnUnit(w, 'titan');
    t.x = 1000;
    const near = spawnUnit(w, 'drone');
    near.x = 1080; // primary target, in range 90
    const e2 = spawnUnit(w, 'drone');
    e2.x = 1100;
    const e3 = spawnUnit(w, 'drone');
    e3.x = 1040;
    const far = spawnUnit(w, 'drone');
    far.x = 1180; // 100 from the primary target
    for (const e of [near, e2, e3]) e.hp = 60;
    step(w);
    expect(w.units).toEqual([t, far]);
    expect(far.hp).toBe(70);
    expect(far.kbStage).toBe(0);
  });

  it('hits only enemies within the radius of the primary target, inclusive', () => {
    const w = createWorld();
    const t = spawnUnit(w, 'titan');
    t.x = 1000;
    const primary = spawnUnit(w, 'rustbot');
    primary.x = 1050;
    const edge = spawnUnit(w, 'rustbot');
    edge.x = 1140; // exactly 90 away
    const out = spawnUnit(w, 'rustbot');
    out.x = 1141;
    step(w);
    expect(primary.hp).toBe(90);
    expect(edge.hp).toBe(90);
    expect(out.hp).toBe(150);
  });

  it('does not damage friendly units', () => {
    const w = createWorld();
    const t = spawnUnit(w, 'titan');
    t.x = 1000;
    const friend = spawnUnit(w, 'scrapper');
    friend.x = 1015; // within splash radius of the target, outside the foe's range
    const foe = spawnUnit(w, 'rustbot');
    foe.x = 1050;
    step(w);
    expect(friend.hp).toBe(120);
    expect(t.hp).toBe(900);
  });

  it('splash victims go through knockback logic', () => {
    const w = createWorld();
    const t = spawnUnit(w, 'titan');
    t.x = 1000;
    const primary = spawnUnit(w, 'rustbot');
    primary.x = 1050;
    const side = spawnUnit(w, 'rustbot');
    side.x = 1100;
    step(w);
    expect(side.hp).toBe(90);
    expect(side.staggerTicks).toBeGreaterThan(0);
    expect(side.kbStage).toBe(1);
    expect(side.x).toBe(1140); // knocked back 40 and held in place this tick
  });

  it('a base target takes damage once and enemy units near the base take splash', () => {
    const w = createWorld();
    const t = spawnUnit(w, 'titan');
    t.x = BASE_X.enemy - 60 - 90; // base in range, no unit within 90
    const guard = spawnUnit(w, 'rustbot');
    guard.x = BASE_X.enemy - 20; // out of titan range (>90) but within 90 of the base x
    expect(Math.abs(t.x - guard.x)).toBeGreaterThan(90);
    step(w);
    expect(w.baseHp.enemy).toBe(3500 - 60);
    expect(guard.hp).toBe(90);
  });
});
