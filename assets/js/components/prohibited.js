class ProhibitedComponent {
  constructor(container, main) {
    this.containerElement = container;
    this.main = main;

    this.populate();
    window.addEventListener('day-change', this.populate.bind(this));
  }

  populate() {
    const times = utils.prohibitedTimes(App.todaysData);
    this.containerElement.querySelector('.prohibited__sunrise').textContent = times.sunrise || '--:--';
    this.containerElement.querySelector('.prohibited__ishraq').textContent = times.ishraq || '--:--';
    this.containerElement.querySelector('.prohibited__zawaal').textContent = times.zawaal || '--:--';
  }
}
