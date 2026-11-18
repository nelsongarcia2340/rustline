import { expect, test } from '@playwright/test';

function trackErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test('loads without console errors and renders at desktop size', async ({ page }) => {
  const errors = trackErrors(page);

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.waitForTimeout(500);

  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/screenshots/desktop-1280x720.png' });
});

test('renders at a landscape phone size', async ({ page }) => {
  const errors = trackErrors(page);

  await page.setViewportSize({ width: 812, height: 375 });
  await page.goto('/');
  await page.waitForTimeout(500);

  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/screenshots/phone-812x375.png' });
});

test('deploying a scrapper spawns a player unit', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(300);

  await page.click('button[data-unit-id="scrapper"]');
  await page.waitForTimeout(100);

  const hasPlayerUnit = await page.evaluate(() => {
    const game = (window as unknown as { __game: { world: () => { units: { def: { side: string } }[] } } })
      .__game;
    return game.world().units.some((u) => u.def.side === 'player');
  });

  expect(hasPlayerUnit).toBe(true);
});
