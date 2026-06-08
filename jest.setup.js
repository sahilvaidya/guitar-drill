// FormData is available in modern Node (v18+) but not exposed globally in some jest environments
if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    append() {}
    get() { return null; }
  };
}
