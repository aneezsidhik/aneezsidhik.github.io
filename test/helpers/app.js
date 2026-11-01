const fixtures = require('../fixtures/data');
const { flyers } = require('../fixtures/content');

/** Local wall-clock time in Europe/London (fixture dates are in GMT). */
function at(localDateTime) {
  return new Date(`${localDateTime.replace(' ', 'T')}Z`);
}

/**
 * Opens the timetable with a paused fake clock at `now` and fixture data.
 * Time only moves when the test calls `advance()`.
 */
async function openApp(page, {
  now,
  data = fixtures.data,
  content = flyers,
  masjidClosed = false,
} = {}) {
  await page.route('**/data/data.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: `App.data = ${JSON.stringify(data)};`,
  }));
  await page.route('**/data/content.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: `App.masjidClosed = ${masjidClosed};\nApp.content = ${JSON.stringify(content)};`,
  }));

  // Headless Chromium blocks autoplay; record calls instead of playing audio.
  await page.addInitScript(() => {
    window.__alarmPlays = [];
    HTMLMediaElement.prototype.play = function play() {
      window.__alarmPlays.push({ at: new Date().toISOString(), element: this.className });
      return Promise.resolve();
    };
  });

  // Install slightly earlier so the clock can't run past `now` before pausing.
  await page.clock.install({ time: new Date(now.getTime() - 10_000) });
  await page.clock.pauseAt(now);
  await page.goto('/index.html');
}

async function advance(page, ms) {
  await page.clock.runFor(ms);
}

async function alarmPlays(page) {
  return page.evaluate(() => window.__alarmPlays);
}

module.exports = { at, openApp, advance, alarmPlays };
