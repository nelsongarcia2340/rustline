# Rustline

An original robot lane-battle game for the browser. Deploy robots from your base on the left, push
along the lane, and destroy the enemy base on the right before yours falls. Pixel-art sprites are
drawn in code; there are no image assets.

## Run

```
npm install
npm run dev      # dev server (also exposes the window.__game debug hook)
npm run build    # type-check and production build into dist/
```

## Test

```
npm test         # Vitest: the pure sim, data, camera, input logic and headless battles
npm run e2e      # Playwright smoke test (starts its own dev server on 127.0.0.1:5199)
```

`npm run e2e` uses the `playwright` package already installed globally (with its chromium); it does not
download a browser. Screenshots land in `test-results/` (git-ignored).

## Controls

- Click or tap a deploy button to send out that robot (it costs energy and has a cooldown).
- Keys `1`-`5` do the same for the five buttons, left to right.
- Drag the lane to pan the camera; it follows the front line again when you let go.
- After the win/lose screen, press `R` or `Enter` (or the button) to restart.

## Gameplay

Energy regenerates steadily and is capped, so every deploy is a choice: many cheap Scrappers, tanky
Bulwarks, long-range Bolt-Gunners, fast Sprinters, or a saved-up splash Titan. Units walk toward the
enemy, stop when something is in range, and get knocked back each time they lose a third of their HP.
The enemy sends a scripted stream of Rustbots, Drones, Turret-Walkers and Siege Tanks; when their base
drops to half HP the Overseer boss arrives.

## Layout

```
src/sim/      pure game logic (world, combat, economy, spawner); no DOM, fully unit-tested
src/data/     unit stats and the stage 1 enemy timeline (plain data)
src/render/   camera, skyline and the canvas renderer
src/sprites/  pixel sprite definitions and the sprite cache
src/ui/       HUD, input, drag-to-pan, game-loop timing, end-of-battle overlay
src/main.ts   wiring and the requestAnimationFrame loop
tests/        Vitest tests mirror src/; tests/e2e/smoke.mjs is the browser smoke test
```

## Tuning

- `src/data/units.ts`: cost, cooldown, HP, damage, range, speed of every robot.
- `src/data/stage1.ts`: when each enemy spawns (spawns stop at 150s).
- `src/sim/constants.ts`: lane length, base HP, boss trigger, starting energy, energy cap and regen.

`tests/sim/battle.test.ts` plays a scripted strategy against the real sim and expects a win in a time
band, so retune with it open; the design doc in `docs/superpowers/specs/` lists the same numbers.
