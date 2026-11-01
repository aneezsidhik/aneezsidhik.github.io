const { test, expect } = require('@playwright/test');
const { at, openApp, advance } = require('../helpers/app');

/** Elements whose box is outside the viewport or whose content is clipped. */
function findOverflow() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const selectors = [
    '.title', '.date-time__time', '.date-time__date',
    '.schedule__heading', '.schedule__time-name', '.schedule__time',
    '.prohibited__item', '.marquee',
  ];
  const problems = [];
  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const name = `${selector}[${i}] "${el.textContent.trim().slice(0, 20)}"`;
      if (r.left < -0.5 || r.right > vw + 0.5) problems.push(`${name} outside viewport horizontally (${r.left}..${r.right} of ${vw})`);
      if (r.top < -0.5 || r.bottom > vh + 0.5) problems.push(`${name} outside viewport vertically (${r.top}..${r.bottom} of ${vh})`);
      if (selector !== '.marquee' && el.scrollWidth > el.clientWidth + 1) {
        problems.push(`${name} content clipped (${el.scrollWidth} > ${el.clientWidth})`);
      }
    });
  }
  return problems;
}

test.describe('portrait layout', () => {
  test.beforeEach(async ({ page }) => {
    const { width, height } = page.viewportSize();
    expect(height).toBeGreaterThan(width);
  });

  test('timetable fits the screen without horizontal scrolling', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 05:00:00') });
    await page.evaluate(() => document.fonts.ready);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(page.viewportSize().width);
    expect(await page.evaluate(findOverflow)).toEqual([]);
  });

  test('widest times (e.g. 12:55) still fit', async ({ page }) => {
    const { makeDay } = require('../fixtures/data');
    const wide = { ...makeDay({ offset: 0, hijriDate: '24 Rajab 1447' }) };
    wide.schedule = wide.schedule.map(() => ['12:55', '12:55']);
    await openApp(page, { now: at('2026-01-14 00:30:00'), data: { '14-01': wide, '15-01': wide } });
    await page.evaluate(() => document.fonts.ready);

    expect(await page.evaluate(findOverflow)).toEqual([]);
  });

  test('phone warning covers the timetable area', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:49:10') });
    await advance(page, 1_000);

    const warning = await page.locator('.phone-warning').boundingBox();
    const main = await page.locator('.main').boundingBox();
    expect(warning).toEqual(main);
    expect(warning.width).toBeGreaterThanOrEqual(page.viewportSize().width - 4);
  });

  test('screenshot: timetable', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:31:00') });
    await advance(page, 1_000); // first tick highlights the Asr row
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('timetable.png', { mask: [page.locator('.marquee')] });
  });

  test('screenshot: text flyer', async ({ page }) => {
    const content = [{ sayingInArabic: 'بِسْمِ اللَّهِ', sayingInEnglish: 'In the name of Allah', reference: 'Al-Fatiha 1:1' }];
    await openApp(page, { now: at('2026-01-14 10:00:00'), content });
    await advance(page, 20_000);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('flyer.png');
  });

  test('screenshot: phone warning', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:49:29') });
    await advance(page, 1_000);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('phone-warning.png', { mask: [page.locator('.marquee')] });
  });
});
