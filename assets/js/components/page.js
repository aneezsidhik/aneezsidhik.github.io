class TabRotateComponent {
  constructor() {
    this.timetableElement = document.querySelector('.page');
    this.flyerElement = document.querySelector('.flyer');
    this.sayingInArabicElement = document.querySelector('.sayingInArabic');
    this.sayingInEnglishElement = document.querySelector('.sayingInEnglish');
    this.referenceElement = document.querySelector('.reference');
    this.pages = [this.timetableElement];

    this.enabledElement = this.timetableElement;
    this.timetableElement.classList.add('show');
    this.pageIndex = 1;
    this.contentIndex = 0;
    this.phoneWarningOn = false;
    this.slideStartTime = new Date();
    this.bindEvents();
    this.content = [];
    this.filterFlyers();
    if(this.content.length >= 1) {
      this.pages.push(this.flyerElement);
    }

    this.populateTimetableElement();

    if (this.content.length >= 1) {
        window.addEventListener('second-change', this.populateTimetableElement.bind(this));
        window.addEventListener('second-change', this.populateFlyer.bind(this));
    }
  }

  bindEvents() {
     window.addEventListener('disable-tab-rotate', this.phoneWarningEnabled.bind(this));
     window.addEventListener('enable-tab-rotate', this.phoneWarningDisabled.bind(this));
     window.addEventListener('alarm-on', this.enableTimetableElement.bind(this));
  }

  phoneWarningEnabled() {
    this.phoneWarningOn = true;
    this.enableTimetableElement();
  }

  phoneWarningDisabled() {
      this.phoneWarningOn = false;
  }

  enableTimetableElement() {
      if(this.enabledElement == this.flyerElement) {
          this.enabledElement.classList.remove('show');
          this.enabledElement = this.timetableElement;
          this.enabledElement.classList.add('show');
          this.pageIndex = 1;
      }
  }

  filterFlyers() {
    for (let index = 0; index < App.content.length; index++) {
        const NOW = new Date();
        let enabled = true;
        const fromDate = App.content[index].fromDate;
        const toDate = App.content[index].toDate;
        if(fromDate && NOW < utils.convertStringDateTimeToDateObject(fromDate)) {
            enabled = false;
        }
        if(toDate && NOW > utils.convertStringDateTimeToDateObject(toDate)) {
            enabled = false;
        }
        if(enabled) {
            this.content.push(App.content[index])
        }
    }
  }

  populateTimetableElement() {

    const NOW = new Date();
    const DIFF = NOW.getTime() - this.slideStartTime.getTime();
    if(this.enabledElement == this.flyerElement && DIFF >= 5000) {
        this.slideStartTime = NOW;
        this.enabledElement.classList.remove('show');
        this.enabledElement = this.timetableElement;
        this.enabledElement.classList.add('show');

        if(this.pageIndex == 1) {
            App.main.loadTodaysData();
        }

        if (this.pageIndex >= this.pages.length) {
            this.pageIndex = 0;
        }
        if (this.contentIndex >= this.content.length) {
            this.contentIndex = 0;
        }
    }
  }

  populateFlyer() {
    if(this.phoneWarningOn) {
        return;
    }

    const NOW = new Date();
    const DIFF = NOW.getTime() - this.slideStartTime.getTime();
    if(this.enabledElement == this.timetableElement && DIFF >= 20000) {
        this.slideStartTime = NOW;
        this.enabledElement.classList.remove('show');
        this.enabledElement = this.flyerElement;
        this.enabledElement.classList.add('show');
        const content = this.content[this.contentIndex];

        this.contentIndex++;
        if(content.image || content.sayingInArabic || content.sayingInEnglish) {
            if(content.image) {
                this.flyerElement.style.backgroundImage = `url(assets/images/${content.image})`;
            } else {
                this.flyerElement.style = `none`;
            }
            this.sayingInArabicElement.textContent = content.sayingInArabic;
            this.sayingInEnglishElement.textContent = content.sayingInEnglish;

            if(content.reference) {
                this.referenceElement.textContent = `(${content.reference})`;
            } else {
                this.referenceElement.textContent = '';
            }
        }

        if (this.pageIndex >= this.pages.length) {
            this.pageIndex = 0;
        }
        if (this.contentIndex >= this.content.length) {
            this.contentIndex = 0;
        }
    }
  }
}
