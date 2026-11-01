const { test, expect } = require('@playwright/test');
const { at, openApp } = require('../helpers/app');

test.describe('scrolling message', () => {
  test("shows the silence reminder and Jum'a khutba times", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:00:00') });
    const text = page.locator('.scrolling_text');

    await expect(text).toContainText('PLEASE OBSERVE SILENCE IN THE MASJID');
    await expect(text).toContainText("JUM'A KHUTBA TIMES: 12:30 & 01:15");
    await expect(text).not.toContainText('EID PRAYER');
  });

  test("includes the day's custom message when set", async ({ page }) => {
    await openApp(page, { now: at('2026-01-13 10:00:00') });

    await expect(page.locator('.scrolling_text')).toContainText('EID PRAYER AT 8AM');
  });

  test('includes the screen size', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:00:00') });
    const size = await page.evaluate(() => `${screen.availWidth} x ${screen.availHeight}`);

    await expect(page.locator('.scrolling_text')).toContainText(size);
  });
});
