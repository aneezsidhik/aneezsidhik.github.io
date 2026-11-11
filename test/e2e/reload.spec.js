const { test, expect } = require('@playwright/test');
const { at, openApp, advance, blockReload } = require('../helpers/app');
const fixtures = require('../fixtures/data');

test.describe('hourly reload', () => {
  test('reloads the page when the hour changes', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:59:58') });
    await page.evaluate(() => { window.__beforeReload = true; });

    await Promise.all([
      page.waitForEvent('load'),
      advance(page, 3_000),
    ]);

    expect(await page.evaluate(() => window.__beforeReload)).toBeUndefined();
    await expect(page.locator('.date-time__hours-minutes')).toHaveText('11:00');
  });

  test('does not reload on a minute change', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:58:58') });
    await page.evaluate(() => { window.__beforeReload = true; });

    await advance(page, 3_000);

    expect(await page.evaluate(() => window.__beforeReload)).toBe(true);
  });

  test("waits until an azan or jama'at is over before reloading", async ({ page }) => {
    const data = structuredClone(fixtures.data);
    data['14-01'].schedule[2] = ['14:30', '15:00']; // Asr jama'at on the hour
    await openApp(page, { now: at('2026-01-14 14:59:58'), data });
    await page.evaluate(() => { window.__beforeReload = true; });

    await advance(page, 3_000); // 15:00:01, the hour changed in the middle of jama'at
    await advance(page, 60_000); // 15:01:01
    expect(await page.evaluate(() => window.__beforeReload)).toBe(true);

    await Promise.all([
      page.waitForEvent('load'),
      advance(page, 3 * 60_000), // 15:04:01
    ]);
    expect(await page.evaluate(() => window.__beforeReload)).toBeUndefined();
  });

  test("does not reload when the server can't be reached, and keeps trying", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:59:58') });
    await blockReload(page);
    await page.evaluate(() => { window.__beforeReload = true; });

    await advance(page, 3_000);
    await advance(page, 5 * 60_000);

    expect(await page.evaluate(() => window.__beforeReload)).toBe(true);
    await expect(page.locator('.page')).toHaveClass(/\bshow\b/);

    await page.unroute('**/index.html');
    await Promise.all([
      page.waitForEvent('load'),
      advance(page, 60_000), // the next minute retries
    ]);
    expect(await page.evaluate(() => window.__beforeReload)).toBeUndefined();
  });
});
