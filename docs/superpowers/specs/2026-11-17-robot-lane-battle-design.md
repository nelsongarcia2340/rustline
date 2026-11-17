# Robot Lane Battle: Prototype Design

Working title: **Rustline** (placeholder, easy to change).

## Intent and why
A single-lane auto-battler in the style of cat/unit-deployment lane games, but with machines. The player deploys robots that walk toward an enemy base and fight automatically. The player's only decisions are *what* to deploy and *when*, under an energy budget. The prototype's job is to prove the core loop is fun: a battle that plays start to finish with real tension (hold the line, manage energy, push the base).

## Goals
- One complete battle screen: player base (left), enemy base (right), one lane, energy meter, a deploy bar of 5 unit buttons, win and lose screens, restart.
- 5 player robots and 5 enemy types, all with distinct roles.
- Runs in a desktop or phone browser, landscape. Mouse and touch both work.
- Pixel-art look, with all sprites generated from in-code pixel grids (no image files).
- Battle rules fully testable without a browser.

## Non-goals (this prototype)
Stage map, currency/upgrades, saving, gacha/unlocks, unit evolutions, base cannon, sound, localization.

## Anti-goals
- Copying any existing game's names, characters, art, music, or stage layouts. Everything here is original.
- A prototype that looks fine but whose combat feel is wrong. Feel is the deliverable.

## Constraints
- TypeScript, Vite, Canvas 2D, Vitest. No game framework.
- Fixed-timestep simulation (30 ticks/s), decoupled from render frame rate.
- Canvas logical resolution 960x540, scaled to fit with crisp pixel scaling (image smoothing off).
- The simulation layer must not import anything from the DOM or canvas.

## Approaches considered
1. **TypeScript + Canvas 2D + Vite, sim separated from rendering. (Chosen.)** Combat rules become plain testable code. Small, fast on phones. Cost: I write the small engine pieces (loop, input, sprite drawing).
2. Phaser 3. Faster scene/input/animation setup, but a large dependency and logic tangled into its objects, which makes automated tests harder.
3. Single HTML file, no build. Easiest to share, but gets messy past the prototype and is awkward to test.

The user left the choice to me and approved option 1 with the defaults below.

## Game rules
- **Lane:** x from 0 to 3000 world units. Player base at x=100, enemy base at x=2900. Camera shows 960 units at a time and follows the action. The player can drag/scroll it, and it auto-follows the front line by default.
- **Energy:** starts at 100, regenerates 8/sec, capped at 600. Each unit has a cost and a per-unit redeploy cooldown. A button is disabled while unaffordable or cooling down.
- **Units** move toward the opposing base at their speed. A unit stops when an enemy (or the enemy base) is within its range and attacks on its attack cooldown. Melee units hit the front-most enemy in range. The Titan's attack hits all enemies within its splash radius.
- **Knockback:** when a unit's HP crosses each 1/3 threshold from damage (and on death), it is knocked back a short distance and briefly staggers.
- **Bases:** 2000 HP player, 3500 HP enemy. At 50% enemy base HP, the boss (Overseer) spawns once.
- **Win / lose:** enemy base HP 0 means win. Player base HP 0 means lose. Both show an overlay with a Restart button.
- **Enemy spawning:** a scripted timeline (list of `{atSecond, type}`) plus a slow trickle of Rustbots, so pressure is constant.

## Roster (all numbers are starting values, tuned in playtesting)
| Player robot | Role | Cost | Cooldown | HP | Dmg | Range | Speed |
|---|---|---|---|---|---|---|---|
| Scrapper | cheap melee swarm | 50 | 2s | 120 | 12 | 30 | 60 |
| Bolt-Gunner | ranged | 100 | 4s | 90 | 18 | 220 | 45 |
| Bulwark | tank | 150 | 8s | 500 | 10 | 30 | 35 |
| Sprinter | fast striker | 120 | 6s | 150 | 25 | 30 | 140 |
| Titan | heavy splash | 400 | 25s | 900 | 60 splash | 90 | 30 |

| Enemy | Role | HP | Dmg | Range | Speed |
|---|---|---|---|---|---|
| Rustbot | basic melee | 150 | 10 | 30 | 50 |
| Drone | fast, fragile | 70 | 14 | 30 | 120 |
| Turret-Walker | ranged | 180 | 20 | 250 | 35 |
| Siege Tank | heavy melee | 800 | 45 | 50 | 28 |
| Overseer (boss) | mini-boss | 3000 | 80 splash | 120 | 20 |

## Architecture
```
src/
  sim/      # pure logic: World, Unit, tick(), combat, energy, spawning, win/lose
  data/     # unit stats, stage timeline (plain data)
  render/   # canvas drawing, camera, sprite cache, effects
  sprites/  # pixel-grid definitions + palette + animation frames
  ui/       # deploy bar, energy meter, overlays, input handling
  main.ts   # loop: fixed-step sim, render every frame
tests/      # Vitest tests for sim/ and data/
```
Sprites: each is a character grid (e.g. 24x24) with a palette, 2 walk frames and 1 attack frame, rendered once to offscreen canvases and drawn scaled up. Swapping in PNG sheets later only touches `sprites/`.

## Testing
- Vitest, test-first for `sim/`: movement, targeting, range stop, damage, knockback thresholds, splash, energy regen/cap/cooldowns, base HP win/lose, boss trigger, stage timeline.
- A headless full-battle test: scripted deployments must reach a deterministic win; doing nothing must lose.
- Browser smoke check with Playwright: page loads, screenshot at desktop and phone size, deploy a unit and see it appear.

## Left to the builder
Exact sprite pixel art, animation timing, colours, effects (hit flashes, small explosions), camera behavior details, button layout polish, and all balance tweaks (numbers above are starting points).

## Calls I made (please check)
- Working title "Rustline".
- Landscape-only layout.
- Knockback at HP thirds.
- Auto-follow camera with manual drag.
- No sound in the prototype.
