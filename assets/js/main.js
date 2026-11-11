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
    window.addEventListener('day-change', this.refreshData.bind(this));
    window.addEventListener('minute-change', this.onMinuteChange.bind(this));
    window.addEventListener('hour-change', this.requestReload.bind(this));
  }

  loadTomorrowsData() {
        let date = new Date();
        date.setDate(date.getDate()+1);
        const DAY_MONTH = utils.dayKey(date);

        if (!App.data[DAY_MONTH]) {
          console.warn(`Data for tomorrow not found (${DAY_MONTH})`);
        }
        App.tomorrowsData = App.data[DAY_MONTH] || utils.emptyDay();
  }

  loadTodaysData() {
        const DAY_MONTH = utils.dayKey(new Date());

        App.dataMissing = !App.data[DAY_MONTH];
        if (App.dataMissing) {
          console.warn(`Data for today not found (${DAY_MONTH})`);
        }
        App.todaysData = App.data[DAY_MONTH] || utils.emptyDay();
        App.schedule.populateRows(App.todaysData, App.tomorrowsData);
  }

  /** Switches to the new day's data without reloading the page (also works offline). */
  refreshData() {
    this.loadTomorrowsData();
    this.loadTodaysData();
  }

  onMinuteChange() {
    // Rows move on to tomorrow's times once a jama'at has passed.
    this.loadTodaysData();
    if (this.reloadPending) {
      this.reload();
    }
  }

  /**
   * Reloads hourly to pick up new code and data, but only when it is safe:
   * not around an azan/jama'at, and only if the server answers (a failed reload
   * would leave a blank screen). Retries every minute until it succeeds.
   */
  requestReload() {
    this.reloadPending = true;
    this.reload();
  }

  reload() {
    if (this.reloading || App.schedule.hasAlertSoon()) {
      return;
    }
    this.reloading = true;
    fetch(window.location.href, { method: 'HEAD', cache: 'no-store' })
      .then((response) => {
        if (response.ok) {
          window.location.reload();
        }
      })
      .catch(() => {})
      .finally(() => {
        this.reloading = false;
      });
  }

  loadComponent(component, selector) {
    Array.from(document.querySelectorAll(selector)).forEach((container) => {
      new component(container, this);
    });
  }
}

App.main = new Main();
App.main.init();