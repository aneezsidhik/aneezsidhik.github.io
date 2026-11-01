// Fixture timetable used in place of data/data.js.
// All dates are in January 2026 so Europe/London is on GMT (UTC+0).
//   13-01 Tue, 14-01 Wed, 15-01 Thu, 16-01 Fri, 17-01 Sat
// Jama'at times avoid xx:00 because the page reloads on every hour change.
// Each day shifts every start time by `offset` minutes so that
// "today" and "tomorrow" rows are distinguishable.

function shift(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function makeDay({ offset, hijriDate, juma = ['12:30', '13:15'], message = '' }) {
  return {
    hijriDate,
    schedule: [
      [shift('6:00', offset), shift('6:30', offset)],   // Fajr
      [shift('12:15', offset), shift('12:45', offset)], // Dhuhr
      [shift('14:30', offset), shift('14:50', offset)], // Asr
      [shift('16:20', offset), shift('16:25', offset)], // Maghrib
      [shift('18:00', offset), shift('19:30', offset)], // Isha
    ],
    sunrise: shift('7:50', offset),
    juma,
    message,
  };
}

const data = {
  '13-01': makeDay({ offset: 0, hijriDate: '23 Rajab 1447', message: 'EID PRAYER AT 8AM' }),
  '14-01': makeDay({ offset: 0, hijriDate: '24 Rajab 1447' }),
  '15-01': makeDay({ offset: 1, hijriDate: '25 Rajab 1447' }),
  '16-01': makeDay({ offset: 2, hijriDate: '26 Rajab 1447', juma: ['12:35', '13:20'] }),
  '17-01': makeDay({ offset: 3, hijriDate: '27 Rajab 1447' }),
};

module.exports = { data, makeDay, shift };
