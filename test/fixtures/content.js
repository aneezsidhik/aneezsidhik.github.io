// Fixture flyers used in place of data/content.js.
const flyers = [
  { image: 'flyer_a.jpg' },
  {
    sayingInArabic: 'بِسْمِ اللَّهِ',
    sayingInEnglish: 'In the name of Allah',
    reference: 'Al-Fatiha 1:1',
  },
  { image: 'expired.jpg', toDate: '2025-12-31 23:59:00' },
  { image: 'future.jpg', fromDate: '2030-01-01 00:00:00' },
  { image: 'flyer_b.jpg' },
];

module.exports = { flyers };
