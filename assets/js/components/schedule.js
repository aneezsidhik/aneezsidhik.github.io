class ScheduleComponent {
  constructor(container, main) {
    this._24_HOURS = 24 * 60 * 60 *1000;
    this.main = main;
    this.containerElement = container;
    this.azanTimes = [];
    this.prayerTimes = [];
    this.prayerNames = [];
    this.maxDiff = 30 * 60 * 1000;
    this.nextPrayerTime = this._24_HOURS;
    this.hideRowClass = 'hide_row';

    this.updateCurrentAzanAndPrayerTime();

    window.addEventListener('second-change', this.updateCurrentAzanAndPrayerTime.bind(this));
  }

  populateRows(todaysData, tomorrowsData) {
    this.azanTimes = [];
    this.prayerTimes = [];
    this.prayerNames = [];

    const NOW = new Date();

    Array.from(this.containerElement.querySelectorAll('.schedule__row'))
    .forEach((row, index) => {
      const todaysJamaatTime = utils.convertStringTimeToDateObject(todaysData.schedule[index][1]).getTime();
      if(todaysJamaatTime < NOW.getTime()) {
          row.querySelector('.schedule__time--left').textContent = utils.convertToTwelveHourTime(tomorrowsData.schedule[index][0]);
          row.querySelector('.schedule__time--right').textContent = utils.convertToTwelveHourTime(tomorrowsData.schedule[index][1]);
          if(NOW.getDay() == 4 && row.querySelector('.schedule__time-name').textContent == "DHUHR") {
            row.querySelector('.schedule__time-name').textContent = "JUMA";
          }
      } else {
          row.querySelector('.schedule__time--left').textContent = utils.convertToTwelveHourTime(todaysData.schedule[index][0]);
          row.querySelector('.schedule__time--right').textContent = utils.convertToTwelveHourTime(todaysData.schedule[index][1]);
          if(NOW.getDay() == 5 && row.querySelector('.schedule__time-name').textContent == "DHUHR") {
            row.querySelector('.schedule__time-name').textContent = "JUMA";
          }
      }
      if (App.masjidClosed) {
        row.querySelector('.schedule__time--right').textContent = "-";
      }
      this.azanTimes.push(todaysData.schedule[index][0]);
      this.prayerTimes.push(todaysData.schedule[index][1]);
      this.prayerNames.push(row.querySelector('.schedule__time-name').textContent);
    });
    this.azanTimes.push(todaysData.sunrise);
    this.prayerTimes.push('');
    this.prayerNames.push('SUNRISE');

    this.azanTimes.push(document.querySelector('.prohibited__ishraq').textContent);
    this.prayerTimes.push('');
    this.prayerNames.push('ISHRAQ');
  }

  updateCurrentAzanAndPrayerTime() {
    this.updateCurrentPrayerTime();
    this.updateCurrentAzanTime();
    this.updateNextPrayerTime();
  }

  updateCurrentPrayerTime() {
    const NOW = new Date();
    const CURRENTLY_HIGHLIGHTED = this.containerElement.querySelector('.schedule__row--highlighted');
    if (CURRENTLY_HIGHLIGHTED) {
      CURRENTLY_HIGHLIGHTED.classList.remove('schedule__row--highlighted');
    }

    for (let index = 0; index < this.prayerTimes.length; index++) {
      const TIME = utils.convertStringTimeToDateObject(this.prayerTimes[index]);
      const DIFF = TIME.getTime() - NOW.getTime();
      const ABS_DIFF = Math.abs(DIFF);

      this.determineNextPrayerTime(DIFF,`${this.prayerNames[index]} JAMA'AT IN:`);

      if (ABS_DIFF < this.maxDiff) {
        const rowToHighLight = this.containerElement.querySelectorAll('.schedule__row')[index];
        if(rowToHighLight) {
           rowToHighLight.classList.add('schedule__row--highlighted');
        }
        this.handlePhoneWarningAndAlarmEvents(DIFF);
      }
    }
  }

  updateCurrentAzanTime() {
    const NOW = new Date();

    for (let index = 0; index < this.azanTimes.length; index++) {
      const TIME = utils.convertStringTimeToDateObject(this.azanTimes[index]);
      const DIFF = TIME.getTime() - NOW.getTime();
      this.determineNextPrayerTime(DIFF,`${this.prayerNames[index]} IN:`);
      if (DIFF > 0  && DIFF <= 1000) {
        window.dispatchEvent(new Event('alarm-on'));
        break;
      }
    }
  }

  updateNextPrayerTime() {
    if(this.nextPrayerTime < this._24_HOURS && this.nextPrayerTime >= 1000) {
        const hours = Math.floor((this.nextPrayerTime / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((this.nextPrayerTime / (1000 * 60)) % 60);
        const seconds = Math.ceil((this.nextPrayerTime / 1000) % 60);

        App.nextPrayerTime = `${utils.pad(hours)}:${utils.pad(minutes)}`;
        App.nextPrayerName = this.nextPrayer;
    } else {
        App.nextPrayerTime = '';
        App.nextPrayerName = '';
    }
  }

  determineNextPrayerTime(DIFF,nextPrayerNameAppender) {
    if(DIFF >= 0 && (DIFF < this.nextPrayerTime || this.nextPrayerTime < 1000)) {
      this.nextPrayerTime = DIFF;
      this.nextPrayer = nextPrayerNameAppender;
    }
  }

  handlePhoneWarningAndAlarmEvents(DIFF) {
    if (DIFF > 0) {
      if (DIFF <= 60 * 1000) {
        window.dispatchEvent(new CustomEvent('phone-warning-on', {
          detail: DIFF
        }));
        window.dispatchEvent(new Event('disable-tab-rotate'));
        if(DIFF <= 1000) {
            window.dispatchEvent(new Event('alarm-on'));
        }
      }
    }
    else {
      window.dispatchEvent(new Event('phone-warning-off'));
      window.dispatchEvent(new Event('enable-tab-rotate'));
    }
  }
}
