class Tick {
  constructor() {
    this.lastTime = new Date();

    this.tick();

    window.setInterval(this.tick.bind(this), 1000);
  }

  tick() {
    const NOW = new Date();

    if (NOW.getTime() !== this.lastTime.getTime()) {
      window.dispatchEvent(new Event('second-change'));

      if (NOW.getMinutes() !== this.lastTime.getMinutes()) {
        window.dispatchEvent(new Event('minute-change'));

        if (NOW.getHours() !== this.lastTime.getHours()) {
          window.dispatchEvent(new Event('hour-change'));

          if (NOW.getDate() !== this.lastTime.getDate()) {
            window.dispatchEvent(new Event('day-change'));
          }
        }
      }
    }

    this.lastTime = NOW;
  }
}
