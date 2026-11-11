class MessageComponent {
  constructor(container, main) {
    this.containerElement = container;
    this.main = main;
    this.twoTabs = '\u00a0'.repeat(8);

    this.populate();
    window.addEventListener('day-change', this.populate.bind(this));
  }

  populate() {
    const juma = App.todaysData.juma;
    this.jumaTimes = `JUM'A KHUTBA TIMES: `.concat(utils.convertToTwelveHourTime(juma[0]), ' & ', utils.convertToTwelveHourTime(juma[1]));
    this.messages = ['PLEASE OBSERVE SILENCE IN THE MASJID', this.jumaTimes];

    if (App.dataMissing) {
      this.messages.push('TODAY\'S TIMES ARE NOT AVAILABLE');
    }
    if (App.todaysData.message) {
      this.messages.push(App.todaysData.message);
    }
    this.containerElement.textContent = this.messages.join(this.twoTabs);
  }
}
