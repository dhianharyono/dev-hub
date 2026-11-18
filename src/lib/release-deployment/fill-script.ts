import type { FormAnswer } from './form';

const FILL_FUNCTIONS = `
function norm(value) {
  return String(value || '').replace(/\\s+/g, ' ').trim().toLowerCase();
}
function setNativeValue(el, value) {
  var proto = el.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  var desc = Object.getOwnPropertyDescriptor(proto, 'value');
  el.focus();
  if (desc && desc.set) desc.set.call(el, value); else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
  el.blur();
}
function findField(id) {
  return document.getElementById(id)
    || document.querySelector('[data-automation-id="' + id + '"]')
    || document.querySelector('[name="' + id + '"]')
    || document.querySelector('input[id^="' + id + '"]')
    || document.querySelector('textarea[id^="' + id + '"]');
}
function findQuestionRoot(id) {
  var el = document.getElementById(id) || document.querySelector('[id^="' + id + '"]');
  if (!el) return null;
  return el.closest('[data-automation-id="questionItem"]')
    || el.closest('[role="group"]')
    || el.parentElement;
}
function formatDate(value, el) {
  var placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
  var year = value.slice(0, 4);
  var month = value.slice(5, 7);
  var day = value.slice(8, 10);
  if (placeholder.indexOf('mm/dd') >= 0) return month + '/' + day + '/' + year;
  return day + '/' + month + '/' + year;
}
function fillChoice(answer) {
  var wanted = (Array.isArray(answer.value) ? answer.value : [answer.value]).map(norm);
  var labels = Array.prototype.slice.call(
    document.querySelectorAll('label[for^="' + answer.id + '"]'),
  );
  if (labels.length === 0) {
    var root = findQuestionRoot(answer.id);
    if (root) {
      labels = Array.prototype.slice.call(
        root.querySelectorAll('label, [role="checkbox"], [role="radio"], [role="option"]'),
      );
    }
  }
  var clicked = 0;
  labels.forEach(function (node) {
    var text = norm(node.innerText || node.textContent);
    if (wanted.indexOf(text) < 0) return;
    var role = node.getAttribute && node.getAttribute('role');
    if (role) {
      if (node.getAttribute('aria-checked') === 'false') node.click();
      clicked += 1;
      return;
    }
    var input = node.querySelector && node.querySelector('input');
    if (!input && node.getAttribute('for')) {
      input = document.getElementById(node.getAttribute('for'));
    }
    if (!input) return;
    if (!input.checked && node.click) node.click();
    clicked += 1;
  });
  return clicked;
}
function fillText(answer) {
  var el = findField(answer.id);
  if (!el) return { ok: false, reason: 'field tidak ditemukan' };
  var value = answer.kind === 'date'
    ? formatDate(String(answer.value), el)
    : String(answer.value);
  setNativeValue(el, value);
  return { ok: true, value: el.value };
}
function fillAll() {
  var results = ANSWERS.map(function (answer) {
    try {
      if (answer.kind === 'choice') {
        var count = fillChoice(answer);
        return { id: answer.id, title: answer.title, ok: count >= 1, filled: count };
      }
      var result = fillText(answer);
      return {
        id: answer.id,
        title: answer.title,
        ok: result.ok,
        value: result.value,
        reason: result.reason,
      };
    } catch (err) {
      return {
        id: answer.id,
        title: answer.title,
        ok: false,
        reason: err && err.message ? err.message : String(err),
      };
    }
  });
  return results;
}
`;

export function buildFillScript(answers: FormAnswer[]): string {
  return `var ANSWERS = ${JSON.stringify(answers)};\n${FILL_FUNCTIONS}\nfillAll();`;
}

