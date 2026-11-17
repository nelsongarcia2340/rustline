# Rustline Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playable single-lane robot battle in the browser: deploy robots with energy, destroy the enemy base, win/lose/restart.

**Architecture:** A pure, DOM-free simulation (`src/sim`) stepped at a fixed 30 ticks/s, driven by plain data (`src/data`). A separate Canvas 2D layer (`src/render`, `src/sprites`, `src/ui`) reads the world state and draws it; it never mutates it except through `deploy()` and `restart`.

**Tech Stack:** TypeScript, Vite, Vitest, Canvas 2D, Playwright (smoke only).

**Spec:** `docs/superpowers/specs/2026-11-17-robot-lane-battle-design.md`

## Global Constraints
- Sim layer imports nothing from the DOM or canvas. `TICKS_PER_SEC = 30`.
- Logical canvas 960x540, crisp scaling (`imageSmoothingEnabled = false`), landscape.
- Lane 0..3000; player base x=100, enemy base x=2900; base hit-width 60 (a unit is in range of a base when `abs(unit.x - baseX) - 60 <= range`). Player spawn x=160, enemy spawn x=2840.
- Energy: start 100, regen 8/sec, cap 600. Bases: player 2000 HP, enemy 3500 HP. Boss (Overseer) spawns once when enemy base HP <= 50%.
- Unit stats exactly as in the spec's roster tables. Attack intervals (my call, seconds): Scrapper 0.8, Bolt-Gunner 1.2, Bulwark 1.5, Sprinter 0.7, Titan 3.0; Rustbot 1.0, Drone 0.7, Turret-Walker 1.4, Siege Tank 2.0, Overseer 3.0. Splash radius 90 for Titan and 120 for Overseer.
- Knockback at each 1/3 of max HP lost (and on death): 40 units backward, 10-tick stagger (no moving or attacking).
- All names, art and stages original. Commit messages end with the attribution lines given in the session.

## Review Focus
1. Deploy with energy exactly equal to cost must succeed; with less, or during cooldown, or after game over, must be refused and change nothing. (Task 5)
2. Several units dying in one tick (splash) must be removed cleanly with no skipped or double-processed units. (Task 4)
3. Knockback must never push a unit past its own base or below x=0 / above 3000. (Task 4)
4. A side with no opposing units must simply walk to the base, with no crash and no stall. (Task 3)
5. A long frame (hidden tab) must not run unbounded catch-up ticks; cap at 5 ticks per frame. (Task 9)

---

### Task 1: Scaffold and unit data

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts` (placeholder), `.gitignore`
- Create: `src/data/units.ts`
- Test: `tests/data/units.test.ts`

**Interfaces:**
- Produces: `type Side = 'player' | 'enemy'`; `interface UnitDef { id: string; side: Side; name: string; cost: number; cooldownSec: number; hp: number; dmg: number; range: number; speed: number; attackIntervalSec: number; splashRadius: number }` (0 = single target); `const PLAYER_ROSTER: UnitDef[]` (5, deploy-bar order); `const ENEMY_ROSTER: UnitDef[]` (5); `function getDef(id: string): UnitDef` (throws on unknown id).

- [ ] **Step 1:** `git init`, `npm init`, install `vite typescript vitest`; add scripts `dev`, `build`, `test` (`vitest run`).
- [ ] **Step 2: Write failing tests** in `tests/data/units.test.ts`: roster lengths are 5 and 5; `getDef('titan')` has `cost 400, hp 900, dmg 60, splashRadius 90`; `getDef('scrapper')` has `cost 50, cooldownSec 2, hp 120`; `getDef('nope')` throws; every def has `hp > 0` and `speed > 0`.
- [ ] **Step 3:** Run `npx vitest run` → FAIL (module missing).
- [ ] **Step 4:** Implement `src/data/units.ts` with ids `scrapper, bolt-gunner, bulwark, sprinter, titan` and `rustbot, drone, turret-walker, siege-tank, overseer`, values from the spec tables.
- [ ] **Step 5:** Run `npx vitest run` → PASS; `npm run build` succeeds. Commit.

### Task 2: World, spawning units, movement

**Files:** Create `src/sim/world.ts`, `src/sim/constants.ts`; Test `tests/sim/movement.test.ts`

**Interfaces:**
- Consumes: `UnitDef`, `getDef`.
- Produces: `interface Unit { uid: number; def: UnitDef; x: number; hp: number; attackTimer: number; staggerTicks: number; kbStage: number }`; `interface World { tick: number; units: Unit[]; baseHp: Record<Side, number>; energy: number; cooldowns: Record<string, number>; status: 'playing' | 'won' | 'lost'; bossSpawned: boolean; nextUid: number }`; `createWorld(): World`; `spawnUnit(world: World, defId: string): Unit`; `step(world: World): void` (this task: movement only). Constants exported from `constants.ts`: `TICKS_PER_SEC, LANE_MIN, LANE_MAX, BASE_X, BASE_HALF_WIDTH, SPAWN_X, BASE_MAX_HP`.

- [ ] **Step 1: Failing tests:** `createWorld()` has 100 energy, 2000/3500 base HP, `status 'playing'`; `spawnUnit(w,'scrapper')` is at x=160; `spawnUnit(w,'rustbot')` is at x=2840; after 30 `step`s a scrapper has moved +60 (x=220) and a rustbot -50 (x=2790).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS. **Step 5:** Commit.

### Task 3: Targeting, range stop, attacks

**Files:** Create `src/sim/combat.ts`; Modify `src/sim/world.ts` (`step` calls `combatPhase`); Test `tests/sim/combat.test.ts`

**Interfaces:**
- Consumes: `World`, `Unit`, constants.
- Produces: `findTarget(world: World, u: Unit): { kind: 'unit'; unit: Unit } | { kind: 'base'; side: Side } | null` (front-most opposing unit within `range`, else opposing base if in base range, else null); `applyDamage(world: World, target: Unit | Side, amount: number): void`.

- [ ] **Step 1: Failing tests:** a scrapper with a rustbot 20 units ahead stops moving and damages it by 12 after its first attack; it attacks again only after `0.8s` (24 ticks); with no enemies, a scrapper keeps walking to the enemy base, stops once `abs(x - 2900) - 60 <= 30`, and reduces enemy base HP by 12; a Bolt-Gunner hits an enemy 200 units away but not 300 away; of two enemies in range it hits the front-most.
- [ ] **Step 2-5:** Run FAIL, implement, run PASS, commit.

### Task 4: Knockback, splash, death

**Files:** Modify `src/sim/combat.ts`; Test `tests/sim/knockback_splash.test.ts`

**Interfaces:**
- Produces: `applyDamage` now handles knockback and death; units with `hp <= 0` are removed at the end of `step` (not mid-iteration). Splash: when `def.splashRadius > 0`, hit every opposing unit within radius of the primary target.

- [ ] **Step 1: Failing tests:** a 120 HP unit hit for 50 (above 2/3 line) is knocked back 40 and has `staggerTicks 10`; a stagger unit does not move or attack for 10 ticks; one big hit crossing two thresholds causes a single knockback; a Titan hit kills three clustered enemies (all removed, none double-processed) and damages one 100 units away not at all; a player unit at x=105 knocked back is clamped to `LANE_MIN` and a knockback never goes beyond its own base side or lane bounds.
- [ ] **Step 2-5:** Run FAIL, implement, run PASS, commit.

### Task 5: Energy, deploy, cooldowns

**Files:** Create `src/sim/economy.ts`; Modify `src/sim/world.ts`; Test `tests/sim/economy.test.ts`

**Interfaces:**
- Produces: `canDeploy(world: World, defId: string): boolean`; `deploy(world: World, defId: string): boolean` (spends cost, starts cooldown, spawns the unit); energy regen is 8/sec applied each step, capped at 600; cooldowns tick down each step.

- [ ] **Step 1: Failing tests:** 90 ticks idle → energy 100 + 24 = 124; capped at 600; energy exactly 50 → `deploy('scrapper')` true and energy 0; energy 49 → false, nothing changes; second scrapper deploy during its 2s cooldown → false, passes after 60 ticks; `deploy` returns false and changes nothing when `status !== 'playing'`.
- [ ] **Step 2-5:** Run FAIL, implement, run PASS, commit.

### Task 6: Stage script, boss, win/lose, headless battle

**Files:** Create `src/data/stage1.ts`, `src/sim/spawner.ts`; Modify `src/sim/world.ts`; Test `tests/sim/battle.test.ts`

**Interfaces:**
- Produces: `interface StageEvent { atSecond: number; type: string }`; `STAGE_1: StageEvent[]` (roughly 40 events over ~180s: Rustbot trickle every ~6s early, Drones from 30s, Turret-Walkers from 60s, Siege Tanks from 100s); the spawner reads it each step; `step` sets `status` to `'won'` at enemy base 0 and `'lost'` at player base 0 (lost wins a tie); boss `overseer` spawns once at enemy base HP <= 1750.

- [ ] **Step 1: Failing tests:** doing nothing for 300s → status `'lost'`; a scripted strategy (deploy scrapper/bulwark/gunner whenever affordable, Titan when ≥400) wins within 600s; boss spawns exactly once and only after enemy base HP <= 1750; after `'won'`, further steps change nothing; every event in `STAGE_1` references a real enemy id (this test also guards against typos).
- [ ] **Step 2-5:** Run FAIL, implement, run PASS. If the scripted strategy can't win, tune `STAGE_1` and spec numbers (note it in the commit). Commit.

### Task 7: Pixel sprites

**Files:** Create `src/sprites/palette.ts`, `src/sprites/defs.ts`, `src/sprites/cache.ts`, plus `src/sprites/base.ts` (bases); Test `tests/sprites/defs.test.ts`

**Interfaces:**
- Produces: `interface SpriteDef { palette: Record<string, string>; frames: { walk1: string[]; walk2: string[]; attack: string[] } }` (rows of characters, `.` is transparent); `SPRITES: Record<string, SpriteDef>` keyed by unit id (all 10) plus `'base-player'` and `'base-enemy'`; `buildSpriteCache(): Record<string, Record<'walk1' | 'walk2' | 'attack', HTMLCanvasElement>>`.

- [ ] **Step 1: Failing tests** (pure data, no canvas): every unit id has a sprite; all frames of a sprite have identical dimensions; every character used in a frame (other than `.`) exists in its palette; enemies and players use distinct dominant colors (players cool blue/teal, enemies warm red/orange) so sides read at a glance.
- [ ] **Step 2-5:** Run FAIL, author the grids (about 24x24 each, Titan and Overseer larger), run PASS, commit.

### Task 8: Renderer and camera

**Files:** Create `src/render/camera.ts`, `src/render/renderer.ts`; Test `tests/render/camera.test.ts`

**Interfaces:**
- Produces: `interface Camera { x: number }`; `updateCamera(cam: Camera, world: World, dragging: boolean): void` (eases toward the front-most player unit, clamped to `[0, 3000 - 960]`, ignored while dragging); `drawWorld(ctx: CanvasRenderingContext2D, world: World, cam: Camera, sprites: ReturnType<typeof buildSpriteCache>, nowMs: number): void` (parallax background, ground strip, bases with HP bars, units with a 2-frame walk, an attack frame while attacking, hit flash, flip for the enemy side).

- [ ] **Step 1: Failing camera tests:** camera never leaves its clamp; it moves toward the front-most player unit; it does not move while `dragging`.
- [ ] **Step 2-5:** Run FAIL, implement camera, implement renderer (verified visually in Task 9/10), run PASS, commit.

### Task 9: UI, input, game loop

**Files:** Create `src/ui/hud.ts`, `src/ui/input.ts`, `src/ui/overlay.ts`; Modify `src/main.ts`, `index.html`; Test `tests/ui/loop.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces: `function ticksToRun(accumulatorMs: number, dtMs: number): { ticks: number; accumulatorMs: number }` (fixed 33.33ms step, **at most 5 ticks per frame**, leftover dropped beyond the cap); the HUD: energy meter (`energy / 600`), five deploy buttons showing cost and a cooldown fill, disabled unless `canDeploy`; touch and mouse both trigger buttons; drag on the lane pans the camera; win/lose overlay with a Restart button (`createWorld()` fresh); canvas scales to fit the window preserving 16:9 with crisp pixels.

- [ ] **Step 1: Failing tests:** `ticksToRun(0, 100)` yields 3 ticks; a 5000ms frame yields 5 ticks (cap); accumulator remainder is carried between frames when under the cap.
- [ ] **Step 2-5:** Run FAIL, implement `ticksToRun` and the UI and wire `main.ts`, run PASS; then `npm run dev` and play a battle by hand. Commit.

### Task 10: Browser smoke check and tuning pass

**Files:** Create `tests/e2e/smoke.spec.ts` (Playwright), `playwright.config.ts`; Modify `src/data/*` for balance.

- [ ] **Step 1:** Playwright test: load the dev server, no console errors, screenshot at 1280x720 and 812x375; click the Scrapper button and assert (via a `window.__game` debug hook exposed only in dev) that a player unit exists.
- [ ] **Step 2:** Run the smoke test → PASS; look at both screenshots (sprites legible, buttons reachable on the phone size).
- [ ] **Step 3:** Play a full battle manually at ~2x speed in a headless run or with the scripted strategy; adjust stats/stage timeline only if the match is trivially won or lost, noting changes in the commit. Commit, and add a short `README.md` (run, test, controls).

---

## Self-review
- **Spec coverage:** battle screen, energy, deploy bar, 5+5 units, knockback, splash, bases, boss at 50%, win/lose/restart (Tasks 2-6, 9); pixel sprites in code (7); renderer/camera (8); touch and mouse, landscape scaling (9); Vitest on the sim plus headless battle and a Playwright smoke test (1-6, 10). Non-goals are not planned.
- **Type consistency:** `UnitDef`, `Unit`, `World`, `deploy/canDeploy`, `step`, `buildSpriteCache` and `drawWorld` are named the same in every task that uses them.
- **Proportion:** the plan carries decisions (names, signatures, values, assertions) and leaves the bodies to the implementer.
