class ScheduleComponent {
  constructor(container, main) {
    this._24_HOURS = 24 * 60 * 60 *1000;
    this.main = main;
    this.containerElement = container;
    this.azanTimes = [];
    this.prayerTimes = [];
    this.prayerNames = [];
    this.tomorrowFajr = [];
    this.maxDiff = 30 * 60 * 1000;
    this.nextPrayerTime = this._24_HOURS;
    this.alertsEnabled = true;
    this.phoneWarningActive = false;
    this.alarmWindowEnd = null;

    this.updateCurrentAzanAndPrayerTime();

    window.addEventListener('second-change', this.updateCurrentAzanAndPrayerTime.bind(this));
  }

  populateRows(todaysData, tomorrowsData) {
    this.azanTimes = [];
    this.prayerTimes = [];
    this.prayerNames = [];
    this.alertsEnabled = !App.masjidClosed;

    const NOW = new Date();
    const IS_THURSDAY = NOW.getDay() == 4;
    const IS_FRIDAY = NOW.getDay() == 5;

    Array.from(this.containerElement.querySelectorAll('.schedule__row'))
    .forEach((row, index) => {
      // On Fridays the Dhuhr jama'at is the first Jum'a, then the second one.
      let jamaatTime = todaysData.schedule[index][1];
      if (IS_FRIDAY && index == 1) {
        const firstJuma = utils.convertStringTimeToDateObject(todaysData.juma[0]).getTime();
        jamaatTime = NOW.getTime() > firstJuma ? todaysData.juma[1] : todaysData.juma[0];
      }
      const secondJuma = utils.convertStringTimeToDateObject(todaysData.juma[1]).getTime();
      const todaysJamaatTime = utils.convertStringTimeToDateObject(jamaatTime).getTime();
      const jamaatPassed = todaysJamaatTime < NOW.getTime();
      const shown = jamaatPassed ? tomorrowsData : todaysData;

      row.querySelector('.schedule__time--left').textContent = utils.convertToTwelveHourTime(shown.schedule[index][0]);
      row.querySelector('.schedule__time--right').textContent = utils.convertToTwelveHourTime(shown.schedule[index][1]);

      if(jamaatPassed && IS_THURSDAY && index == 1) {
        row.querySelector('.schedule__time-name').textContent = "JUM'A";
        row.querySelector('.schedule__time--right').textContent = utils.convertToTwelveHourTime(tomorrowsData.juma[0]);
      } else if(IS_FRIDAY && index == 1 && NOW.getTime() <= secondJuma) {
        row.querySelector('.schedule__time-name').textContent = "JUM'A";
        row.querySelector('.schedule__time--right').textContent = utils.convertToTwelveHourTime(jamaatTime);
      } else if(index == 1) {
        row.querySelector('.schedule__time-name').textContent = "DHUHR";
      }
      if (App.masjidClosed) {
        row.querySelector('.schedule__time--right').textContent = "-";
      }
      this.azanTimes.push(todaysData.schedule[index][0]);
      // No jama'at while the masjid is closed, so no highlight, phone warning or alarm.
      this.prayerTimes.push(this.alertsEnabled ? jamaatTime : '');
      this.prayerNames.push(row.querySelector('.schedule__time-name').textContent);
    });
    const PROHIBITED = utils.prohibitedTimes(todaysData);

    this.azanTimes.push(todaysData.sunrise);
    this.prayerTimes.push('');
    this.prayerNames.push('SUNRISE');

    this.azanTimes.push(PROHIBITED.ishraq);
    this.prayerTimes.push('');
    this.prayerNames.push('ISHRAQ');

    this.azanTimes.push(PROHIBITED.zawaal);
    this.prayerTimes.push('');
    this.prayerNames.push('ZAWAAL');

    // Tomorrow's Fajr, so the countdown carries on after Isha.
    this.tomorrowFajr = [tomorrowsData.schedule[0][0], this.alertsEnabled ? tomorrowsData.schedule[0][1] : ''];
  }

  /** True when any azan or jama'at is within a couple of minutes (don't reload then). */
  hasAlertSoon() {
    const NOW = Date.now();
    return this.azanTimes.concat(this.prayerTimes).some((time) => {
      return Math.abs(utils.convertStringTimeToDateObject(time).getTime() - NOW) < 2 * 60 * 1000;
    });
  }

  updateCurrentAzanAndPrayerTime() {
    const NOW = new Date();
    // Alarms fire for times in (previous window end, now + 1s], so a late tick can't skip one.
    const WINDOW_START = this.alarmWindowEnd !== null && NOW.getTime() - this.alarmWindowEnd < 5000
      ? this.alarmWindowEnd : NOW.getTime();
    const WINDOW_END = NOW.getTime() + 1000;
    this.alarmWindowEnd = WINDOW_END;
    this.nextPrayerTime = this._24_HOURS;

    const JAMAAT_ALARM_DUE = this.updateCurrentPrayerTime(NOW, WINDOW_START, WINDOW_END);
    const AZAN_ALARM_DUE = this.updateCurrentAzanTime(NOW, WINDOW_START, WINDOW_END);
    this.updateTomorrowsFajr(NOW);
    this.updateNextPrayerTime();

    // One alarm even when the azan and jama'at coincide (Maghrib).
    if (JAMAAT_ALARM_DUE || AZAN_ALARM_DUE) {
      window.dispatchEvent(new Event('alarm-on'));
    }
  }

  /** Time falls inside the alarm window (and so the alarm should sound once). */
  isInWindow(time, windowStart, windowEnd) {
    return time > windowStart && time <= windowEnd;
  }

  updateCurrentPrayerTime(NOW, windowStart, windowEnd) {
    this.containerElement.querySelectorAll('.schedule__row--highlighted')
      .forEach((row) => row.classList.remove('schedule__row--highlighted'));

    let alarmDue = false;
    let warningDiff = null;

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
        if (DIFF > 0 && DIFF <= 60 * 1000) {
          warningDiff = DIFF;
        }
      }
      if (this.isInWindow(TIME.getTime(), windowStart, windowEnd)) {
        alarmDue = true;
      }
    }

    this.updatePhoneWarning(warningDiff);
    return alarmDue;
  }

  updatePhoneWarning(warningDiff) {
    if (warningDiff !== null) {
      window.dispatchEvent(new CustomEvent('phone-warning-on', {
        detail: warningDiff
      }));
      if (!this.phoneWarningActive) {
        this.phoneWarningActive = true;
        window.dispatchEvent(new Event('disable-tab-rotate'));
      }
    } else if (this.phoneWarningActive) {
      this.phoneWarningActive = false;
      window.dispatchEvent(new Event('phone-warning-off'));
      window.dispatchEvent(new Event('enable-tab-rotate'));
    }
  }

  updateCurrentAzanTime(NOW, windowStart, windowEnd) {
    let alarmDue = false;

    for (let index = 0; index < this.azanTimes.length; index++) {
      const TIME = utils.convertStringTimeToDateObject(this.azanTimes[index]);
      const DIFF = TIME.getTime() - NOW.getTime();
      this.determineNextPrayerTime(DIFF,`${this.prayerNames[index]} START IN:`);
      if (this.alertsEnabled && this.isInWindow(TIME.getTime(), windowStart, windowEnd)) {
        alarmDue = true;
      }
    }
    return alarmDue;
  }

  updateTomorrowsFajr(NOW) {
    const LABELS = ['START IN:', "JAMA'AT IN:"];
    // Jama'at first, like the other prayers, so it wins a tie with the start time.
    [1, 0].forEach((position) => {
      const TIME = utils.convertStringTimeToDateObject(this.tomorrowFajr[position]);
      TIME.setDate(TIME.getDate() + 1);
      this.determineNextPrayerTime(TIME.getTime() - NOW.getTime(), `${this.prayerNames[0]} ${LABELS[position]}`);
    });
  }

  updateNextPrayerTime() {
    if(this.nextPrayerTime < this._24_HOURS && this.nextPrayerTime >= 1000) {
        const hours = Math.floor((this.nextPrayerTime / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((this.nextPrayerTime / (1000 * 60)) % 60);

        App.nextPrayerTime = `${utils.pad(hours)}:${utils.pad(minutes)}`;
        App.nextPrayerName = this.nextPrayer;
    } else {
        App.nextPrayerTime = '';
        App.nextPrayerName = '';
    }
  }

  determineNextPrayerTime(DIFF,nextPrayerNameAppender) {
    if(DIFF >= 1000 && DIFF < this.nextPrayerTime) {
      this.nextPrayerTime = DIFF;
      this.nextPrayer = nextPrayerNameAppender;
    }
  }
}
