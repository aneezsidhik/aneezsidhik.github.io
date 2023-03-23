class MessageComponent {
  constructor(container, main) {
    this.containerElement = container;
    this.main = main;
    this.currentMessageIndex = 0;
    this.twoTabs = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    this.messages = 'PLEASE OBSERVE SILENCE IN THE MASJID'.concat(this.twoTabs,`FRIDAY PRAYERS: ${App.todaysData.juma}`);

    if (App.todaysData.message) {
      this.messages = this.messages.concat(this.twoTabs,App.todaysData.message);
    }
    this.containerElement.innerHTML = this.messages;
  }
}
