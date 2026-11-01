const { test, expect } = require('@playwright/test');
const { at, openApp, advance } = require('../helpers/app');

/** Reads the timetable as [[name, start, jamaat], ...]. */
async function readRows(page) {
  return page.locator('.schedule__row').evaluateAll((rows) => rows.map((row) => [
    row.querySelector('.schedule__time-name').textContent.trim(),
    row.querySelector('.schedule__time--left').textContent,
    row.querySelector('.schedule__time--right').textContent,
  ]));
}

test.describe('prayer timetable', () => {
  test("shows today's start and jama'at times in 12-hour format", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 05:00:00') });

    expect(await readRows(page)).toEqual([
      ['FAJR', '06:00', '06:30'],
      ['DHUHR', '12:15', '12:45'],
      ['ASR', '02:30', '02:50'],
      ['MAGRIB', '04:20', '04:25'],
      ['ISHA', '06:00', '07:30'],
    ]);
  });

  test("shows tomorrow's times for prayers whose jama'at has passed", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 13:00:00') });

    expect(await readRows(page)).toEqual([
      ['FAJR', '06:01', '06:31'],
      ['DHUHR', '12:16', '12:46'],
      ['ASR', '02:30', '02:50'],
      ['MAGRIB', '04:20', '04:25'],
      ['ISHA', '06:00', '07:30'],
    ]);
  });

  test("shows all of tomorrow's times late at night", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 23:00:00') });

    expect(await readRows(page)).toEqual([
      ['FAJR', '06:01', '06:31'],
      ['DHUHR', '12:16', '12:46'],
      ['ASR', '02:31', '02:51'],
      ['MAGRIB', '04:21', '04:26'],
      ['ISHA', '06:01', '07:31'],
    ]);
  });

  test("shows '-' for every jama'at when the masjid is closed", async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 05:00:00'), masjidClosed: true });

    const rows = await readRows(page);
    expect(rows.map(([, , jamaat]) => jamaat)).toEqual(['-', '-', '-', '-', '-']);
    expect(rows.map(([, start]) => start)).toEqual(['06:00', '12:15', '02:30', '04:20', '06:00']);
  });
});

test.describe('highlighted row', () => {
  const highlighted = (page) => page.locator('.schedule__row.schedule__row--highlighted');

  // Each time is a fresh page load: crossing an hour would reload the page anyway.
  for (const [time, expected] of [
    ['14:19:00', null],
    ['14:21:00', 'ASR'],
    ['14:50:00', 'ASR'],
    ['15:19:00', 'ASR'],
    ['15:21:00', null],
  ]) {
    test(`at ${time} ${expected ? `highlights ${expected}` : 'highlights nothing'} (Asr jama'at 14:50)`, async ({ page }) => {
      await openApp(page, { now: at(`2026-01-14 ${time}`) });
      await advance(page, 1_000);

      if (expected) {
        await expect(highlighted(page)).toHaveCount(1);
        await expect(highlighted(page).locator('.schedule__time-name')).toHaveText(expected);
      } else {
        await expect(highlighted(page)).toHaveCount(0);
      }
    });
  }
});

test.describe("Jum'a", () => {
  test("on Friday morning the Dhuhr row shows the first Jum'a", async ({ page }) => {
    await openApp(page, { now: at('2026-01-16 10:00:00') });

    expect((await readRows(page))[1]).toEqual(["JUM'A", '12:17', '12:35']);
  });

  test("on Friday between the two Jum'as the row shows the second Jum'a", async ({ page }) => {
    await openApp(page, { now: at('2026-01-16 12:50:00') });

    // Start time is already tomorrow's (Saturday) because Dhuhr jama'at has passed
    expect((await readRows(page))[1]).toEqual(["JUM'A", '12:18', '01:20']);
  });

  test("on Friday after the second Jum'a the row goes back to Dhuhr", async ({ page }) => {
    await openApp(page, { now: at('2026-01-16 14:00:00') });

    expect((await readRows(page))[1]).toEqual(['DHUHR', '12:18', '12:48']);
  });

  test("on Thursday after Dhuhr the row previews Friday's first Jum'a", async ({ page }) => {
    await openApp(page, { now: at('2026-01-15 13:00:00') });

    expect((await readRows(page))[1]).toEqual(["JUM'A", '12:17', '12:35']);
  });

  test('on Thursday before Dhuhr jamaat the row still shows Dhuhr', async ({ page }) => {
    await openApp(page, { now: at('2026-01-15 10:00:00') });

    expect((await readRows(page))[1]).toEqual(['DHUHR', '12:16', '12:46']);
  });
});

test.describe('prohibited times footer', () => {
  test('shows sunrise, Ishraq (+15 min) and Zawaal (Dhuhr start -10 min)', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 05:00:00') });

    await expect(page.locator('.prohibited__sunrise')).toHaveText('07:50');
    await expect(page.locator('.prohibited__ishraq')).toHaveText('08:05');
    await expect(page.locator('.prohibited__zawaal')).toHaveText('12:05');
  });
});
