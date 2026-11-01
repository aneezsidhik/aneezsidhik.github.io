const { test, expect } = require('@playwright/test');
const { at, openApp, advance, alarmPlays } = require('../helpers/app');

const EXPANDED = /phone-warning--is-expanded/;

/** Percentage height of the black "fill" bar in the phone warning. */
async function fillPercent(page) {
  const size = await page.locator('.phone-warning').evaluate((el) => el.style.backgroundSize);
  return parseFloat(size.split(' ')[1]);
}

test.describe('phone warning', () => {
  test("appears in the last minute before jama'at with a countdown", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:48:30') });
    const warning = page.locator('.phone-warning');

    await expect(warning).not.toHaveClass(EXPANDED);
    await expect(warning).toBeHidden();

    await advance(page, 31_000); // 14:49:01
    await expect(warning).toHaveClass(EXPANDED);
    await expect(warning).toBeVisible();
    await expect(page.locator('.phone-warning__message')).toHaveText('Please switch off your mobile phone');
    await expect(page.locator('.phone-warning__countdown')).toHaveText('59');
    const early = await fillPercent(page);

    await advance(page, 30_000); // 14:49:31
    await expect(page.locator('.phone-warning__countdown')).toHaveText('29');
    const later = await fillPercent(page);

    expect(early).toBeCloseTo(100 - (59 / 60) * 100, 3);
    expect(later).toBeCloseTo(100 - (29 / 60) * 100, 3);
  });

  test("disappears once jama'at starts", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:49:50') });
    const warning = page.locator('.phone-warning');

    await advance(page, 1_000);
    await expect(warning).toHaveClass(EXPANDED);

    await advance(page, 10_000); // 14:50:01
    await expect(warning).not.toHaveClass(EXPANDED);
    await expect(warning).toBeHidden();
  });

  test('does not appear for a start time (only for jamaat)', async ({ page }) => {
    // Asr starts 14:30, jama'at is 14:50
    await openApp(page, { now: at('2026-01-14 14:29:00') });
    await advance(page, 59_000);

    await expect(page.locator('.phone-warning')).not.toHaveClass(EXPANDED);
  });
});

test.describe('alarm', () => {
  test('plays once when a prayer start time is reached', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:29:50') });
    await advance(page, 20_000);

    const plays = await alarmPlays(page);
    expect(plays).toHaveLength(1);
    expect(plays[0].element).toBe('reminder');
  });

  test("plays once when jama'at is reached", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:49:50') });
    await advance(page, 20_000);

    expect(await alarmPlays(page)).toHaveLength(1);
  });

  test('stays silent at other times', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:30:00') });
    await advance(page, 2 * 60_000);

    expect(await alarmPlays(page)).toHaveLength(0);
  });
});
