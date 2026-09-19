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

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const isNonEmpty = (value) => String(value ?? '').trim().length > 0;
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());

const showToast = (message, type = 'info') => {
  let toastRoot = document.getElementById('toast-root');
  if (!toastRoot) {
    toastRoot = document.createElement('div');
    toastRoot.id = 'toast-root';
    toastRoot.setAttribute('role', 'status');
    toastRoot.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastRoot);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastRoot.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 2600);
};

export {
  $, $$, getText, setText, setValue, on, escapeHtml, isNonEmpty, isValidEmail, showToast
};
