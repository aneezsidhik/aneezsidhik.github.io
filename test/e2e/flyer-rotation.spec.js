const { test, expect } = require('@playwright/test');
const { at, openApp, advance, alarmPlays } = require('../helpers/app');

const SHOWN = /\bshow\b/;

async function expectTimetable(page) {
  await expect(page.locator('.page')).toHaveClass(SHOWN);
  await expect(page.locator('.flyer')).not.toHaveClass(SHOWN);
}

async function expectFlyer(page) {
  await expect(page.locator('.flyer')).toHaveClass(SHOWN);
  await expect(page.locator('.page')).not.toHaveClass(SHOWN);
}

const flyerImage = (page) => page.locator('.flyer').evaluate((el) => el.style.backgroundImage);

test.describe('flyer rotation', () => {
  test('shows the timetable for 20s, then a flyer for 5s', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:00:00') });
    await expectTimetable(page);

    await advance(page, 19_000);
    await expectTimetable(page);

    await advance(page, 1_000);
    await expectFlyer(page);
    expect(await flyerImage(page)).toContain('assets/images/flyer_a.jpg');

    await advance(page, 4_000);
    await expectFlyer(page);

    await advance(page, 1_000);
    await expectTimetable(page);
  });

  test('cycles through active flyers in order, skipping expired and future ones', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 10:00:00') });

    await advance(page, 20_000);
    expect(await flyerImage(page)).toContain('flyer_a.jpg');

    await advance(page, 25_000); // text flyer
    await expectFlyer(page);
    await expect(page.locator('.sayingInArabic')).toHaveText('بِسْمِ اللَّهِ');
    await expect(page.locator('.sayingInEnglish')).toHaveText('In the name of Allah');
    await expect(page.locator('.reference')).toHaveText('(Al-Fatiha 1:1)');
    expect(await flyerImage(page)).toBe('');

    await advance(page, 25_000);
    await expectFlyer(page);
    expect(await flyerImage(page)).toContain('flyer_b.jpg');

    await advance(page, 25_000); // wraps around
    await expectFlyer(page);
    expect(await flyerImage(page)).toContain('flyer_a.jpg');
  });

  test('a flyer becomes active once its fromDate has passed', async ({ page }) => {
    const content = [{ image: 'later.jpg', fromDate: '2026-01-14 09:00:00' }];
    await openApp(page, { now: at('2026-01-14 10:00:00'), content });

    await advance(page, 20_000);
    await expectFlyer(page);
    expect(await flyerImage(page)).toContain('later.jpg');
  });

  test('never rotates when there are no active flyers', async ({ page }) => {
    const content = [
      { image: 'expired.jpg', toDate: '2025-12-31 23:59:00' },
      { image: 'future.jpg', fromDate: '2030-01-01 00:00:00' },
    ];
    await openApp(page, { now: at('2026-01-14 10:00:00'), content });

    for (let i = 0; i < 6; i++) {
      await advance(page, 10_000);
      await expectTimetable(page);
    }
  });

  test('pauses while the phone warning is showing and resumes after', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:48:50') });

    await advance(page, 40_000); // 14:49:30 — warning on, rotation due but blocked
    await expect(page.locator('.phone-warning')).toHaveClass(/phone-warning--is-expanded/);
    await expectTimetable(page);

    await advance(page, 31_000); // 14:50:01 — warning off
    await expectFlyer(page);
  });

  test('an alarm brings the timetable back while a flyer is showing', async ({ page }) => {
    await openApp(page, { now: at('2026-01-14 14:29:35') });

    await advance(page, 20_000); // 14:29:55
    await expectFlyer(page);

    await advance(page, 4_000); // 14:29:59 — Asr start alarm, before the 5s flyer time ends
    expect(await alarmPlays(page)).toHaveLength(1);
    await expectTimetable(page);
  });
});
