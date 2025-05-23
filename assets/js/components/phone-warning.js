class PhoneWarningComponent {
  constructor(container, main) {
    this.main = main;
    this.containerElement = container;
    this.countdownElement = container.querySelector('.phone-warning__countdown');
    this.mainElement = document.querySelector('.main');

    this.isExpandedClass = 'phone-warning--is-expanded';

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('phone-warning-on', this.updateCountdown.bind(this));
    window.addEventListener('phone-warning-off', this.hide.bind(this));
  }

  hide() {
    this.containerElement.classList.remove(this.isExpandedClass);
  }

  updateCountdown(e) {
    this.containerElement.classList.add(this.isExpandedClass);
    let secondsRemaining = Math.ceil(e.detail / 1000);
    this.containerElement.style['background-size'] = `100% ${100 - (secondsRemaining/60)*100}%`;
    this.countdownElement.textContent = secondsRemaining;
  }
}
