const { test, expect } = require('@playwright/test');
const { at, openApp, advance, blockReload } = require('../helpers/app');
const fixtures = require('../fixtures/data');

test.describe('header clock', () => {
  test('shows the time in 12-hour format with seconds', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 13:07:42') });

    await expect(page.locator('.date-time__hours-minutes')).toHaveText('01:07');
    await expect(page.locator('.date-time__seconds')).toHaveText(':42');
  });

  test('shows midnight hour as 12', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 00:05:07') });

    await expect(page.locator('.date-time__hours-minutes')).toHaveText('12:05');
    await expect(page.locator('.date-time__seconds')).toHaveText(':07');
  });

  test('ticks every second and rolls over minutes', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:15:58') });

    await advance(page, 1000);
    await expect(page.locator('.date-time__seconds')).toHaveText(':59');

    await advance(page, 1000);
    await expect(page.locator('.date-time__hours-minutes')).toHaveText('10:16');
    await expect(page.locator('.date-time__seconds')).toHaveText(':00');
  });
});

test.describe('date line', () => {
  test('rotates Gregorian date, Hijri date and next-prayer countdown every 10s', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:40:00') });
    const date = page.locator('.date-time__gregorian-date');
    const countdown = page.locator('.remaining_time');

    await expect(date).toHaveText('WED 14 JAN 2026');
    await expect(date).toHaveClass(/\bshow\b/);
    await expect(countdown).not.toHaveClass(/\bshow\b/);

    await advance(page, 10_000);
    await expect(date).toHaveText('24 RAJAB 1447');

    // 14:40:20 -> Asr jama'at at 14:50 is 9m40s away
    await advance(page, 10_000);
    await expect(countdown).toHaveClass(/\bshow\b/);
    await expect(date).not.toHaveClass(/\bshow\b/);
    await expect(page.locator('.next__prayer__name')).toHaveText("ASR JAMA'AT IN:");
    await expect(page.locator('.next__prayer__time')).toHaveText('00:09');

    await advance(page, 10_000);
    await expect(date).toHaveClass(/\bshow\b/);
    await expect(countdown).not.toHaveClass(/\bshow\b/);
    await expect(date).toHaveText('WED 14 JAN 2026');
  });

  test('counts down to the next start time when it comes before the next jamaat', async ({ page }) => {
    // 15:30 -> Maghrib starts 16:20 (50m), before its 16:25 jama'at
    await openApp(page, { now: at('2026-01-14 15:30:00') });
    await advance(page, 20_000);

    await expect(page.locator('.next__prayer__name')).toHaveText('MAGRIB START IN:');
    await expect(page.locator('.next__prayer__time')).toHaveText('00:49');
  });

  test("keeps counting down to tomorrow's Fajr after Isha", async ({ page }) => {
    // Fajr starts 06:01 on 15 Jan
    await openApp(page, { now: at('2026-01-14 23:00:00') });
    await advance(page, 20_000);

    await expect(page.locator('.remaining_time')).toHaveClass(/\bshow\b/);
    await expect(page.locator('.next__prayer__name')).toHaveText('FAJR START IN:');
    await expect(page.locator('.next__prayer__time')).toHaveText('07:00');
  });

  test('does not stop the date rotation when there is no countdown', async ({ page }) => {
    // Only 14 Jan has data, so there is nothing to count down to after Isha
    const data = { '14-01': fixtures.data['14-01'] };
    await openApp(page, { now: at('2026-01-14 23:30:00'), data });
    const date = page.locator('.date-time__gregorian-date');

    await advance(page, 10_000);
    await expect(date).toHaveText('24 RAJAB 1447');
    await advance(page, 10_000);
    await advance(page, 10_000);
    await expect(date).toHaveText('WED 14 JAN 2026');
    await advance(page, 10_000);
    await expect(date).toHaveText('24 RAJAB 1447');
  });

  test("switches to the new day's Hijri date at midnight without a reload", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 23:59:55') });
    await blockReload(page);
    await page.evaluate(() => { window.__beforeReload = true; });

    await advance(page, 10_000); // 00:00:05 on 15 Jan: the Hijri slot
    await expect(page.locator('.date-time__gregorian-date')).toHaveText('25 RAJAB 1447');
    await advance(page, 20_000); // back to the Gregorian slot
    await expect(page.locator('.date-time__gregorian-date')).toHaveText('THU 15 JAN 2026');
    expect(await page.evaluate(() => window.__beforeReload)).toBe(true);
  });

  test("switches to tomorrow's Hijri date after Maghrib starts", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 16:19:50') });
    const date = page.locator('.date-time__gregorian-date');

    await advance(page, 10_000); // 16:20:00 — not yet after Maghrib start
    await expect(date).toHaveText('24 RAJAB 1447');

    await advance(page, 20_000); // 16:20:20, back to Gregorian
    await expect(date).toHaveText('WED 14 JAN 2026');
    await advance(page, 10_000); // 16:20:30, Hijri again
    await expect(date).toHaveText('25 RAJAB 1447');
  });
});
