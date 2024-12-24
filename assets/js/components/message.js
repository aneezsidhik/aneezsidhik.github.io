class MessageComponent {
  constructor(container, main) {
    this.containerElement = container;
    this.main = main;
    this.currentMessageIndex = 0;
    this.twoTabs = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    this.jumaTimes = 'FRIDAY PRAYERS: '.concat(utils.convertToTwelveHourTime(App.todaysData.juma[0]), ' & ', utils.convertToTwelveHourTime(App.todaysData.juma[1]));
    this.messages = 'PLEASE OBSERVE SILENCE IN THE MASJID'.concat(this.twoTabs,this.jumaTimes);

    if (App.todaysData.message) {
      this.messages = this.messages.concat(this.twoTabs,App.todaysData.message);
    }
    this.containerElement.innerHTML = this.messages;
  }
}
