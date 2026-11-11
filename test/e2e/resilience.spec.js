// The screen must never go blank because a day is missing from data/data.js.
const { test, expect } = require('@playwright/test');
const { at, openApp, advance } = require('../helpers/app');
const fixtures = require('../fixtures/data');

async function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function readRows(page) {
  return page.locator('.schedule__row').evaluateAll((rows) => rows.map((row) => [
    row.querySelector('.schedule__time--left').textContent,
    row.querySelector('.schedule__time--right').textContent,
  ]));
}

test.describe('missing data', () => {
  test("still shows the page, with dashes and a notice, when today has no entry", async ({ page }) => {
    const errors = await trackErrors(page);
    await openApp(page, { now: at('2026-01-20 10:00:00') }); // fixtures end on 17 Jan

    await expect(page.locator('.page')).toHaveClass(/\bshow\b/);
    expect(await readRows(page)).toEqual(Array(5).fill(['--:--', '--:--']));
    await expect(page.locator('.prohibited__sunrise')).toHaveText('--:--');
    await expect(page.locator('.date-time__hours-minutes')).toHaveText('10:00');
    await expect(page.locator('.scrolling_text')).toContainText("TODAY'S TIMES ARE NOT AVAILABLE");

    await advance(page, 60_000);
    await advance(page, 30_000); // flyer rotation still works
    expect(errors).toEqual([]);
  });

  test("shows dashes for tomorrow's times when tomorrow has no entry", async ({ page }) => {
    const errors = await trackErrors(page);
    const data = { '14-01': fixtures.data['14-01'] };
    await openApp(page, { now: at('2026-01-14 23:00:00'), data });

    await expect(page.locator('.page')).toHaveClass(/\bshow\b/);
    expect(await readRows(page)).toEqual(Array(5).fill(['--:--', '--:--']));
    await advance(page, 30_000);
    expect(errors).toEqual([]);
  });

  test('recovers when the next day has data again', async ({ page }) => {
    const data = { '14-01': fixtures.data['14-01'], '15-01': fixtures.data['15-01'] };
    await openApp(page, { now: at('2026-01-14 23:59:58'), data });
    await page.route('**/index.html', (route) => (route.request().method() === 'HEAD' ? route.abort() : route.continue()));

    await advance(page, 3_000);
    expect((await readRows(page))[0]).toEqual(['06:01', '06:31']);
    await expect(page.locator('.scrolling_text')).not.toContainText('NOT AVAILABLE');
  });
});
