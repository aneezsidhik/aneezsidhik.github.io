const { test, expect } = require('@playwright/test');
const { at, openApp } = require('../helpers/app');

test.describe('utilities', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:00:00') });
  });

  test('parses "YYYY-MM-DD HH:MM:SS" as local time without relying on the browser', async ({ page }) => {
    const parsed = await page.evaluate(() => {
      const d = utils.convertStringDateTimeToDateObject('2026-10-26 08:15:30');
      return [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
    });
    expect(parsed).toEqual([2026, 9, 26, 8, 15, 30]);
  });

  test('parses a date with no time as local midnight', async ({ page }) => {
    const parsed = await page.evaluate(() => {
      const d = utils.convertStringDateTimeToDateObject('2026-10-26');
      return [d.getDate(), d.getHours(), d.getMinutes()];
    });
    expect(parsed).toEqual([26, 0, 0]);
  });

  test('gives an Invalid Date for rubbish instead of throwing', async ({ page }) => {
    expect(await page.evaluate(() => isNaN(utils.convertStringDateTimeToDateObject('soon')))).toBe(true);
    expect(await page.evaluate(() => isNaN(utils.convertStringTimeToDateObject('')))).toBe(true);
  });

  test('formats 24-hour times as 12-hour, and missing times as dashes', async ({ page }) => {
    const values = await page.evaluate(() => ['0:05', '9:30', '13:10', '23:59', '', undefined, 'abc']
      .map((time) => utils.convertToTwelveHourTime(time)));
    expect(values).toEqual(['12:05', '09:30', '01:10', '11:59', '--:--', '--:--', '--:--']);
  });

  test('works out Ishraq (+15 min) and Zawaal (-10 min) from the day', async ({ page }) => {
    const times = await page.evaluate(() => utils.prohibitedTimes({
      sunrise: '7:50', schedule: [[], ['12:15', '12:45']],
    }));
    expect(times).toEqual({ sunrise: '07:50', ishraq: '08:05', zawaal: '12:05' });
  });

  test('leaves the prohibited times empty when the day has no data', async ({ page }) => {
    const times = await page.evaluate(() => utils.prohibitedTimes(utils.emptyDay()));
    expect(times).toEqual({ sunrise: '', ishraq: '', zawaal: '' });
  });
});
