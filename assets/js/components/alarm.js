class AlarmComponent {
  constructor() {
    this.reminderElement = document.querySelector(".reminder");
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('alarm-on', this.alarm.bind(this));
  }

  alarm() {
    // play() is rejected when the browser blocks autoplay; that must not surface as an unhandled error.
    const PLAYING = this.reminderElement.play();
    if (PLAYING && PLAYING.catch) {
      PLAYING.catch((error) => console.warn('Alarm could not be played', error));
    }
  }
}
