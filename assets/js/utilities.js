window.utils = {
    pad(number) {
    return number.toString().padStart(2, '0');
    },
    convertToTwelveHourTime(stringTime) {
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
    convertStringTimeToDateObject(stringTime) {
        const PARTS = stringTime.split(':');
        const DATE = new Date();
        DATE.setHours(Number(PARTS[0]));
        DATE.setMinutes(Number(PARTS[1]));
        DATE.setSeconds(0);
        DATE.setMilliseconds(0);
        return DATE;
    },
    convertStringDateTimeToDateObject(stringDate) {
        const DATE = new Date(stringDate);
        return DATE;
    }
};
