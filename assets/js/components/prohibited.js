class ProhibitedComponent {
  constructor(container, main) {
    this.containerElement = container;
    this.main = main;

    this.populate();
  }

  populate() {
    const sunrise = utils.convertStringTimeToDateObject(App.todaysData.sunrise);
    this.containerElement.querySelector('.prohibited__sunrise').textContent = `${utils.pad(sunrise.getHours())}:${utils.pad(sunrise.getMinutes())}`;
    sunrise.setMinutes(sunrise.getMinutes()+15);
    this.containerElement.querySelector('.prohibited__ishraq').textContent =`${utils.pad(sunrise.getHours())}:${utils.pad(sunrise.getMinutes())}`;
    this.containerElement.querySelector('.prohibited__sunset').textContent = utils.convertToTwelveHourTime(App.todaysData.schedule[3][0]);
  }
}
