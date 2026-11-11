window.utils = {
    pad(number) {
    return number.toString().padStart(2, '0');
    },
    /** True for "H:MM" / "HH:MM" strings; false for '' and anything else. */
    isTime(stringTime) {
        return /^\d{1,2}:\d{2}$/.test(stringTime || '');
    },
    convertToTwelveHourTime(stringTime) {
        if (!utils.isTime(stringTime)) {
          return '--:--';
        }
        const PARTS = stringTime.split(':');
        let hours = Number(PARTS[0]);
        if (hours === 0) {
          hours = 12;
        }
        else if (hours > 12) {
          hours -= 12;
        }
        if(hours < 10) {
          hours = `0${hours}`
        }
        return `${hours}:${PARTS[1]}`;
    },
    /** Today at the given time; an Invalid Date when the time is missing. */
    convertStringTimeToDateObject(stringTime) {
        if (!utils.isTime(stringTime)) {
          return new Date(NaN);
        }
        const PARTS = stringTime.split(':');
        const DATE = new Date();
        DATE.setHours(Number(PARTS[0]));
        DATE.setMinutes(Number(PARTS[1]));
        DATE.setSeconds(0);
        DATE.setMilliseconds(0);
        return DATE;
    },
    /**
     * Parses "YYYY-MM-DD" or "YYYY-MM-DD HH:MM[:SS]" as local time.
     * `new Date("YYYY-MM-DD HH:MM:SS")` is not standard and is Invalid Date in Safari.
     */
    convertStringDateTimeToDateObject(stringDate) {
        const MATCH = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(String(stringDate).trim());
        if (!MATCH) {
          return new Date(stringDate);
        }
        const [year, month, day, hours, minutes, seconds] = MATCH.slice(1).map((part) => Number(part || 0));
        return new Date(year, month - 1, day, hours, minutes, seconds);
    },
    /** Key of App.data for the given date, e.g. "09-03". */
    dayKey(date) {
        return `${utils.pad(date.getDate())}-${utils.pad(date.getMonth() + 1)}`;
    },
    /** Placeholder used when the timetable has no entry for a day. */
    emptyDay() {
        return {
            hijriDate: '',
            schedule: [['', ''], ['', ''], ['', ''], ['', ''], ['', '']],
            sunrise: '',
            juma: ['', ''],
            message: ''
        };
    },
    /** Sunrise, Ishraq (sunrise + 15 min) and Zawaal (Dhuhr start - 10 min) as "HH:MM" ('' if unknown). */
    prohibitedTimes(day) {
        const format = (date) => (isNaN(date) ? '' : `${utils.pad(date.getHours())}:${utils.pad(date.getMinutes())}`);

        const sunrise = utils.convertStringTimeToDateObject(day.sunrise);
        const ishraq = utils.convertStringTimeToDateObject(day.sunrise);
        ishraq.setMinutes(ishraq.getMinutes() + 15);
        const zawaal = utils.convertStringTimeToDateObject(day.schedule[1][0]);
        zawaal.setMinutes(zawaal.getMinutes() - 10);

        return { sunrise: format(sunrise), ishraq: format(ishraq), zawaal: format(zawaal) };
    }
};
