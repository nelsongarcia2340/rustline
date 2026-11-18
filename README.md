# Rustline

A single-lane robot auto-battler prototype. Deploy robots under an energy
budget; they walk toward the enemy base and fight automatically. Destroy the
enemy base before yours falls.

## Run

```bash
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`) in a browser. Landscape
only; works with mouse or touch.

## Test

```bash
npm test        # Vitest: sim logic, economy, headless battle
npm run test:e2e  # Playwright: browser smoke test (loads the dev server itself)
npm run build    # production build
```

## Controls

- **Deploy bar** (bottom): click/tap a unit button to deploy it. Disabled
  while unaffordable or on cooldown.
- **Drag** the lane to pan the camera manually; release to resume auto-follow
  of your front-most unit.
- **Restart**: click the Restart button on the win/lose overlay to start a
  fresh battle.

## Roster

5 player robots (Scrapper, Bolt-Gunner, Bulwark, Sprinter, Titan) vs. 5 enemy
types (Rustbot, Drone, Turret-Walker, Siege Tank, and the Overseer boss, which
spawns once the enemy base drops to half HP). Stats are in
[src/data/units.ts](src/data/units.ts); the enemy spawn schedule is in
[src/data/stage1.ts](src/data/stage1.ts).
