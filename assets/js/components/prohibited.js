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
    const zawal = utils.convertStringTimeToDateObject(App.todaysData.schedule[1][0]);
    zawal.setMinutes(zawal.getMinutes()-10);
    this.containerElement.querySelector('.prohibited__zawaal').textContent = `${utils.pad(zawal.getHours())}:${utils.pad(zawal.getMinutes())}`;
  }
}
