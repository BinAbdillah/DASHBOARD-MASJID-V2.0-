const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const getText = (selector, scope = document) => {
  const element = $(selector, scope);
  return element ? element.textContent.trim() : '';
};

const setText = (selector, value, scope = document) => {
  const element = $(selector, scope);
  if (element) element.textContent = value;
};

const setValue = (selector, value, scope = document) => {
  const element = $(selector, scope);
  if (element) element.value = value;
};

const on = (selector, eventName, handler, scope = document) => {
  const element = $(selector, scope);
  if (element) element.addEventListener(eventName, handler);
};

export { $, $$, getText, setText, setValue, on };
