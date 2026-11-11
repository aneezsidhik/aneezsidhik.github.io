class DateTimeComponent {
  constructor(container) {
    this.hoursMinutesElement = container.querySelector('.date-time__hours-minutes');
    this.secondsElement = container.querySelector('.date-time__seconds');
    this.dateElement = container.querySelector('.date-time__gregorian-date');
    this.nextPrayerName = container.querySelector('.next__prayer__name');
    this.nextPrayerTime = container.querySelector('.next__prayer__time');
    this.daysOfWeekShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    this.monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    this.dates = [];
    this.currentDateIndex = 0;

    this.update();
    this.populate();

    window.addEventListener('second-change', this.update.bind(this));
    window.setInterval(this.populate.bind(this), 10000);
  }

  update() {
    let NOW = new Date();
    let hours = NOW.getHours();

    if (hours === 0) {
      hours = 12;
    }
    else if (hours > 12) {
      hours -= 12;
    }

    this.hoursMinutesElement.textContent = `${utils.pad(hours)}:${utils.pad(NOW.getMinutes())}`;
    this.secondsElement.textContent = `:${utils.pad(NOW.getSeconds())}`;
    this.dates = [];
    this.dates.push(`${this.daysOfWeekShort[NOW.getDay()]} ${utils.pad(NOW.getDate())} ${this.monthsShort[NOW.getMonth()]} ${NOW.getFullYear()}`);
    // The Hijri day changes when Maghrib starts.
    let hijriDate = App.todaysData.hijriDate;
    if(NOW > utils.convertStringTimeToDateObject(App.todaysData.schedule[3][0]) && App.tomorrowsData.hijriDate) {
        hijriDate = App.tomorrowsData.hijriDate;
    }
    if (hijriDate) {
        this.dates.push(hijriDate.toUpperCase());
    }
  }

  populate() {
    if (this.currentDateIndex >= this.dates.length) {
        if(App.nextPrayerTime !== '') {
            document.querySelector('.remaining_time').classList.add('show');
            this.dateElement.classList.remove('show');
            this.nextPrayerTime.textContent = App.nextPrayerTime;
            this.nextPrayerName.textContent = App.nextPrayerName;
        }
        // Start over even without a countdown, otherwise the dates never show again.
        this.currentDateIndex = 0;
    } else {
        document.querySelector('.remaining_time').classList.remove('show');
        this.dateElement.classList.add('show');
        this.dateElement.textContent = this.dates[this.currentDateIndex++];
    }
  }
}
