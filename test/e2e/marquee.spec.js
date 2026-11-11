const { test, expect } = require('@playwright/test');
const { at, openApp, advance, blockReload } = require('../helpers/app');
const fixtures = require('../fixtures/data');

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

  test('does not show the screen size (debug leftover)', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:00:00') });
    const size = await page.evaluate(() => `${screen.availWidth} x ${screen.availHeight}`);

    await expect(page.locator('.scrolling_text')).not.toContainText(size);
  });

  test('shows the custom message as plain text, not HTML', async ({ page }) => {
    const data = structuredClone(fixtures.data);
    data['14-01'].message = '<b>EID</b> & more';
    await openApp(page, { now: at('2026-01-14 10:00:00'), data });

    await expect(page.locator('.scrolling_text')).toContainText('<b>EID</b> & more');
    await expect(page.locator('.scrolling_text b')).toHaveCount(0);
  });

  test("switches to the new day's message after midnight without a reload", async ({ page }) => {
    await openApp(page, { now: at('2026-01-13 23:59:58') });
    await blockReload(page);
    await expect(page.locator('.scrolling_text')).toContainText('EID PRAYER AT 8AM');

    await advance(page, 3_000);
    await expect(page.locator('.scrolling_text')).not.toContainText('EID PRAYER AT 8AM');
  });
});
