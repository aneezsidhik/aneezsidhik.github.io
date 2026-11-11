const { test, expect } = require('@playwright/test');
const { at, openApp, advance, alarmPlays } = require('../helpers/app');
const fixtures = require('../fixtures/data');

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

  test("tells the other components once, not every second, when jama'at passes", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:48:50') });
    await page.evaluate(() => {
      window.__events = { off: 0, enable: 0, disable: 0 };
      window.addEventListener('phone-warning-off', () => window.__events.off++);
      window.addEventListener('enable-tab-rotate', () => window.__events.enable++);
      window.addEventListener('disable-tab-rotate', () => window.__events.disable++);
    });

    await advance(page, 120_000); // 14:50:50, well past jama'at but still highlighted

    expect(await page.evaluate(() => window.__events)).toEqual({ off: 1, enable: 1, disable: 1 });
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

  test("plays only once when the start time and jama'at are the same (Maghrib)", async ({ page }) => {
    const data = structuredClone(fixtures.data);
    data['14-01'].schedule[3] = ['16:20', '16:20'];
    await openApp(page, { now: at('2026-01-14 16:19:50'), data });
    await advance(page, 20_000);

    expect(await alarmPlays(page)).toHaveLength(1);
  });

  test('is not skipped when a timer fires late', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:29:57') });

    await page.clock.fastForward(1_900); // 14:29:58.9, tick: Asr is 1.1s away
    expect(await alarmPlays(page)).toHaveLength(0);
    await page.clock.fastForward(1_400); // 14:30:00.3, tick arrives after Asr started
    expect(await alarmPlays(page)).toHaveLength(1);
  });

  test('stays silent at other times', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:30:00') });
    await advance(page, 2 * 60_000);

    expect(await alarmPlays(page)).toHaveLength(0);
  });
});
