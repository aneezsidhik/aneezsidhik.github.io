class Main {
  constructor() {}

  init() {
    new Tick();

    App.schedule = new ScheduleComponent(document.querySelector('.schedule'),this);
    this.loadTomorrowsData();
    this.loadTodaysData();
    this.bindEvents();

    this.loadComponent(DateTimeComponent, '.date-time');
    this.loadComponent(MessageComponent, '.scrolling_text');
    this.loadComponent(PhoneWarningComponent, '.phone-warning');
    this.loadComponent(ProhibitedComponent, '.prohibited');
    //    this.loadComponent(ScheduleComponent, '.schedule');
    new TabRotateComponent();
    new AlarmComponent();
  }

  bindEvents() {
    window.addEventListener('hour-change', this.reload.bind(this));
  }

  loadTomorrowsData() {
        let date = new Date();
        date.setDate(date.getDate()+1);
        const DAY_MONTH = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!App.data[DAY_MONTH]) {
          console.log(`Data for tomorrow not found (${DAY_MONTH})`);
          return;
        }
        App.tomorrowsData = App.data[DAY_MONTH];
  }

  loadTodaysData() {
        let date = new Date();
        const DAY_MONTH = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!App.data[DAY_MONTH]) {
          console.log(`Data for today not found (${DAY_MONTH})`);
          return;
        }
        App.todaysData = App.data[DAY_MONTH];
        App.schedule.populateRows(App.todaysData, App.tomorrowsData);
  }

  reload() {
    window.location.reload();
  }

  loadComponent(component, selector) {
    Array.from(document.querySelectorAll(selector)).forEach((container) => {
      new component(container, this);
    });
  }
}

App.main = new Main();
App.main.init();