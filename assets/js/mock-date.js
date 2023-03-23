Date = class extends Date {
constructor(date) {
  if (date) {
    return super(date);
  }

//  return new Date((Date.now() + ((26+35)*60*1000)+(5 * 60 * 60 * 1000)));
  return new Date((Date.now()));
}
};