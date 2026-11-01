// Checks the real data files (no browser needed).
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');

function load(file) {
  const context = { App: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context);
  return context.App;
}

const TIME = /^\d{1,2}:\d{2}$/;
function minutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
function isTime(value) {
  if (typeof value !== 'string' || !TIME.test(value)) return false;
  const [h, m] = value.split(':').map(Number);
  return h < 24 && m < 60;
}

const NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

test.describe('data/data.js', () => {
  const { data } = load('data/data.js');

  test('has an entry for every day of the year, including 29 Feb', () => {
    const expected = [];
    for (let d = new Date(Date.UTC(2024, 0, 1)); d.getUTCFullYear() === 2024; d.setUTCDate(d.getUTCDate() + 1)) {
      expected.push(`${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    }
    expect(expected).toHaveLength(366);
    expect(expected.filter((key) => !data[key])).toEqual([]);
    expect(Object.keys(data).filter((key) => !expected.includes(key))).toEqual([]);
  });

  test('every day has a Hijri date, sunrise and 5 valid prayer times in order', () => {
    const problems = [];
    for (const [key, day] of Object.entries(data)) {
      if (!day.hijriDate) problems.push(`${key}: missing hijriDate`);
      if (!Array.isArray(day.schedule) || day.schedule.length !== 5) {
        problems.push(`${key}: schedule should have 5 prayers`);
        continue;
      }
      day.schedule.forEach(([start, jamaat], i) => {
        if (!isTime(start)) problems.push(`${key} ${NAMES[i]}: bad start "${start}"`);
        if (!isTime(jamaat)) problems.push(`${key} ${NAMES[i]}: bad jama'at "${jamaat}"`);
        if (isTime(start) && isTime(jamaat) && minutes(jamaat) < minutes(start)) {
          problems.push(`${key} ${NAMES[i]}: jama'at ${jamaat} before start ${start}`);
        }
        if (i > 0 && isTime(start) && minutes(start) <= minutes(day.schedule[i - 1][0])) {
          problems.push(`${key} ${NAMES[i]}: starts ${start}, not after ${NAMES[i - 1]}`);
        }
      });
      if (!isTime(day.sunrise)) {
        problems.push(`${key}: bad sunrise "${day.sunrise}"`);
      } else if (minutes(day.sunrise) <= minutes(day.schedule[0][0]) || minutes(day.sunrise) >= minutes(day.schedule[1][0])) {
        problems.push(`${key}: sunrise ${day.sunrise} not between Fajr and Dhuhr`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("every day has two Jum'a times around midday", () => {
    const problems = [];
    for (const [key, day] of Object.entries(data)) {
      const juma = day.juma || [];
      if (juma.length !== 2 || !juma.every(isTime)) {
        problems.push(`${key}: bad juma ${JSON.stringify(day.juma)}`);
        continue;
      }
      // Times are 24-hour; "1:00" would mean 1am
      if (!juma.every((t) => minutes(t) >= 11 * 60 && minutes(t) <= 15 * 60)) {
        problems.push(`${key}: juma ${juma.join(' & ')} not between 11:00 and 15:00`);
      }
      if (minutes(juma[1]) <= minutes(juma[0])) problems.push(`${key}: second juma not after first`);
    }
    expect(problems).toEqual([]);
  });
});

test.describe('data/content.js', () => {
  const App = load('data/content.js');

  test('sets masjidClosed to a boolean', () => {
    expect(typeof App.masjidClosed).toBe('boolean');
  });

  test('every flyer image exists in assets/images', () => {
    const missing = App.content
      .filter((flyer) => flyer.image)
      .filter((flyer) => !fs.existsSync(path.join(ROOT, 'assets/images', flyer.image)))
      .map((flyer) => flyer.image);
    expect(missing).toEqual([]);
  });

  test('every flyer has an image or text, and valid from/to dates', () => {
    const problems = [];
    App.content.forEach((flyer, i) => {
      if (!flyer.image && !flyer.sayingInArabic && !flyer.sayingInEnglish) problems.push(`#${i}: no image or text`);
      for (const field of ['fromDate', 'toDate']) {
        if (flyer[field] && Number.isNaN(new Date(flyer[field]).getTime())) problems.push(`#${i}: bad ${field} "${flyer[field]}"`);
      }
      if (flyer.fromDate && flyer.toDate && new Date(flyer.toDate) < new Date(flyer.fromDate)) {
        problems.push(`#${i}: toDate before fromDate`);
      }
    });
    expect(problems).toEqual([]);
  });
});
