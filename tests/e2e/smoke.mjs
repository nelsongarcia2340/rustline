// Browser smoke test. Run with `npm run e2e`.
// Starts the Vite dev server itself (the `window.__game` debug hook only exists in dev), drives the
// page with Playwright's chromium, and always shuts the server down again.
// Plain Node script rather than @playwright/test: the environment ships a global `playwright` with a
// matching preinstalled browser, so no extra dependency or browser download is needed.
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'test-results');
const HOST = '127.0.0.1';
const PORT = 5199;
const URL_ = `http://${HOST}:${PORT}/`;

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require('playwright');
  } catch {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return createRequire(path.join(globalRoot, 'noop.js'))('playwright');
  }
}

async function startServer() {
  const vite = path.join(root, 'node_modules', '.bin', 'vite');
  const proc = spawn(vite, ['--host', HOST, '--port', String(PORT), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true, // own process group, so the whole tree can be killed
  });
  server = proc; // visible to the signal handlers while vite is still starting
  let log = '';
  proc.stdout.on('data', (d) => (log += d));
  proc.stderr.on('data', (d) => (log += d));
  let exited = false;
  proc.on('exit', () => (exited = true));
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (exited) throw new Error(`vite exited early:\n${log}`);
    try {
      if ((await fetch(URL_)).ok) return proc;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  await stopServer(proc);
  throw new Error(`vite did not become ready within 30s:\n${log}`);
}

const groupAlive = (proc) => {
  try {
    process.kill(-proc.pid, 0);
    return true;
  } catch {
    return false;
  }
};

/** SIGTERM the vite process group; if anything is still alive after ~2s, SIGKILL the group. */
async function stopServer(proc) {
  try {
    process.kill(-proc.pid, 'SIGTERM');
  } catch {
    return; // already gone
  }
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline && groupAlive(proc)) {
    await new Promise((r) => setTimeout(r, 50));
  }
  if (groupAlive(proc)) {
    try {
      process.kill(-proc.pid, 'SIGKILL');
    } catch {
      /* already gone */
    }
  }
}

const state = (page) =>
  page.evaluate(() => {
    const w = window.__game.world;
    return {
      energy: w.energy,
      tick: w.tick,
      cooldowns: { ...w.cooldowns },
      player: w.units.filter((u) => u.def.side === 'player').map((u) => u.def.id),
    };
  });

async function run(page, errors) {
  // 1. Desktop size: load, screenshot, no scrollbars.
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(URL_);
  await page.waitForFunction(() => window.__game !== undefined);
  await page.waitForTimeout(500); // let a few frames render
  await page.screenshot({ path: path.join(outDir, 'desktop-1280x720.png') });
  await assertNoScrollbars(page, '1280x720');

  // 2. Click the Scrapper button: a player unit appears and energy drops by the cost (+ regen meanwhile).
  const before = await state(page);
  assert.equal(before.player.length, 0, 'no player units before deploying');
  await page.click('.deploy-btn[data-unit="scrapper"]');
  const after = await state(page);
  assert.deepEqual(after.player, ['scrapper'], 'one Scrapper deployed by the button');
  const regen = (12 / 30) * (after.tick - before.tick);
  assert.ok(
    Math.abs(after.energy - (before.energy - 50 + regen)) < 0.01,
    `energy ${before.energy} -> ${after.energy} should drop by the Scrapper cost 50 (plus ${regen.toFixed(2)} regen)`,
  );
  assert.ok(after.cooldowns.scrapper > 0, 'Scrapper cooldown started');

  // 3. Key 2 (Bolt-Gunner, cost 100): ignored when unaffordable, deploys when affordable.
  await page.evaluate(() => {
    window.__game.world.energy = 10;
  });
  await page.keyboard.press('2');
  let s = await state(page);
  assert.deepEqual(s.player, ['scrapper'], 'key 2 with 10 energy must not deploy');
  assert.ok(s.energy < 12, `energy untouched by a refused deploy (got ${s.energy})`);
  await page.evaluate(() => {
    window.__game.world.energy = 300;
  });
  await page.keyboard.press('2');
  s = await state(page);
  assert.deepEqual(s.player, ['scrapper', 'bolt-gunner'], 'key 2 with 300 energy deploys a Bolt-Gunner');
  assert.ok(s.energy < 300 - 100 + 5 && s.energy > 300 - 100 - 1, `energy after Bolt-Gunner: ${s.energy}`);
  await page.keyboard.press('2'); // still cooling down (4s)
  assert.equal((await state(page)).player.length, 2, 'key 2 during cooldown does not deploy again');

  // 4. Phone landscape: layout fits, every deploy button is fully inside the viewport.
  await page.setViewportSize({ width: 812, height: 375 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'phone-812x375.png') });
  await assertNoScrollbars(page, '812x375');
  const boxes = await page.$$eval('.deploy-btn', (els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { id: e.dataset.unit, l: r.left, t: r.top, r: r.right, b: r.bottom };
    }),
  );
  assert.equal(boxes.length, 5, 'five deploy buttons');
  for (const b of boxes) {
    assert.ok(b.l >= 0 && b.t >= 0 && b.r <= 812 && b.b <= 375, `button ${b.id} inside the 812x375 viewport`);
    assert.ok(b.r - b.l >= 40 && b.b - b.t >= 40, `button ${b.id} is at least 40px (tappable)`);
  }

  assert.deepEqual(errors, [], 'no console or page errors');
}

async function assertNoScrollbars(page, label) {
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
    sh: document.documentElement.scrollHeight,
    ih: window.innerHeight,
  }));
  assert.ok(m.sw <= m.iw, `${label}: horizontal scroll (${m.sw} > ${m.iw})`);
  assert.ok(m.sh <= m.ih, `${label}: vertical scroll (${m.sh} > ${m.ih})`);
}

mkdirSync(outDir, { recursive: true });
const { chromium } = loadPlaywright();
let server;
let browser;
let failed = false;
let shuttingDown = false;
for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
  process.on(sig, async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await browser?.close().catch(() => {});
    if (server) await stopServer(server);
    process.exit(code);
  });
}
try {
  server = await startServer();
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await run(page, errors);
  console.log('e2e smoke: all checks passed; screenshots in test-results/');
} catch (e) {
  failed = true;
  console.error(e);
} finally {
  await browser?.close();
  if (server) await stopServer(server);
}
process.exit(failed ? 1 : 0);
