class MessageComponent {
  constructor(container, main) {
    this.containerElement = container;
    this.main = main;
    this.currentMessageIndex = 0;
    this.twoTabs = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    this.jumaTimes = `JUM'A KHUTBA TIMES: `.concat(utils.convertToTwelveHourTime(App.todaysData.juma[0]), ' & ', utils.convertToTwelveHourTime(App.todaysData.juma[1]));
    this.screenSize = window.screen.availWidth +' x ' + window.screen.availHeight;
    this.messages = ['PLEASE OBSERVE SILENCE IN THE MASJID', this.jumaTimes, this.screenSize];

    if (App.todaysData.message) {
      this.messages.push(App.todaysData.message);
    }
    this.containerElement.innerHTML = this.messages.join(this.twoTabs);
  }
}
