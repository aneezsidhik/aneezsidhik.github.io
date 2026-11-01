const { test, expect } = require('@playwright/test');
const { at, openApp, advance } = require('../helpers/app');

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
});
