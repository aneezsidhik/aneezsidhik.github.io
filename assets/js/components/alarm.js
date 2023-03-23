class AlarmComponent {
  constructor() {
    this.reminderElement = document.querySelector(".reminder");
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('alarm-on', this.alarm.bind(this));
  }

  alarm() {
    this.reminderElement.play();
  }
}
