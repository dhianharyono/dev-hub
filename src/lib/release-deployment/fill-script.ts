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
function monthIndex(label) {
  var names = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  var match = String(label || '').match(/([A-Za-z]+)\\s+(\\d{4})/);
  if (!match) return null;
  var index = names.indexOf(match[1]);
  if (index < 0) return null;
  return Number(match[2]) * 12 + index;
}
function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
async function waitFor(getter, timeout) {
  var waited = 0;
  while (waited < timeout) {
    var value = getter();
    if (value) return value;
    await sleep(150);
    waited += 150;
  }
  return null;
}
async function pickDateFromCalendar(day, monthName, year) {
  var targetIndex = monthIndex(monthName + ' ' + year);
  if (targetIndex === null) return 'bulan target tidak valid';
  for (var step = 0; step < 24; step += 1) {
    var header = document.querySelector('[class*=monthAndYear]');
    if (!header) return 'panel kalender tidak ditemukan';
    var currentIndex = monthIndex(header.innerText || header.textContent);
    if (currentIndex === null) return 'label bulan tidak dikenali: ' + (header.innerText || '');
    if (currentIndex === targetIndex) break;
    var controls = Array.prototype.slice.call(
      document.querySelectorAll('[class*=monthComponents] button'),
    );
    var wantNext = currentIndex < targetIndex;
    var control = controls.find(function (button) {
      var title = button.getAttribute('title') || '';
      return wantNext
        ? title.indexOf('bulan berikutnya') >= 0
        : title.indexOf('bulan sebelumnya') >= 0;
    });
    if (!control) return 'tombol navigasi bulan tidak ditemukan';
    control.click();
    await sleep(250);
  }
  var wantedLabel = day + ', ' + monthName + ', ' + year;
  var dayButton = Array.prototype.slice
    .call(document.querySelectorAll('button[class*=dayButton]'))
    .find(function (button) {
      return (button.getAttribute('aria-label') || '').trim() === wantedLabel;
    });
  if (!dayButton) return 'hari ' + day + ' tidak ditemukan di kalender';
  dayButton.click();
  await sleep(300);
  var fieldValue = document.querySelector(
    '[class*=monthAndYear]',
  );
  if (fieldValue) return 'kalender tidak menutup setelah memilih hari';
  return '';
}
async function setDateValue(el, value) {
  var names = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  var parts = String(value).split('/');
  if (parts.length !== 3) return 'format tanggal tidak dikenal: ' + value;
  var monthName = names[Number(parts[1]) - 1];
  if (!monthName) return 'bulan tidak dikenal: ' + parts[1];
  el.focus();
  if (el.getAttribute('aria-expanded') !== 'true') {
    el.click();
  }
  var header = await waitFor(function () {
    return document.querySelector('[class*=monthAndYear]');
  }, 5000);
  if (!header) return 'kalender tanggal tidak terbuka';
  return pickDateFromCalendar(String(Number(parts[0])), monthName, parts[2]);
}
function findField(id) {
  return document.getElementById(id)
    || document.querySelector('[data-automation-id="' + id + '"]')
    || document.querySelector('[name="' + id + '"]')
    || document.querySelector('[aria-labelledby^="QuestionId_' + id + '"]')
    || document.querySelector('input[id^="' + id + '"]')
    || document.querySelector('textarea[id^="' + id + '"]');
}
function findQuestionRoot(id) {
  var el = document.getElementById(id)
    || document.querySelector('[name="' + id + '"]')
    || document.querySelector('[aria-labelledby^="QuestionId_' + id + '"]')
    || document.querySelector('[id^="' + id + '"]');
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
  var root = findQuestionRoot(answer.id);
  var items = root
    ? Array.prototype.slice.call(
        root.querySelectorAll('[data-automation-id="choiceItem"]'),
      )
    : [];
  var itemClicks = 0;
  items.forEach(function (item) {
    var text = norm(item.innerText || item.textContent);
    if (wanted.indexOf(text) < 0) return;
    var input = item.querySelector('input');
    if (!input) return;
    if (!input.checked) input.click();
    itemClicks += 1;
  });
  if (itemClicks > 0) return itemClicks;

  var labels = Array.prototype.slice.call(
    document.querySelectorAll('label[for^="' + answer.id + '"]'),
  );
  if (labels.length === 0) {
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
async function fillText(answer) {
  var el = findField(answer.id);
  if (!el) return { ok: false, reason: 'field tidak ditemukan' };
  if (answer.kind === 'date') {
    var picked = await setDateValue(el, formatDate(String(answer.value), el));
    if (picked) return { ok: false, reason: picked };
    return { ok: true, value: el.value };
  }
  setNativeValue(el, String(answer.value));
  return { ok: true, value: el.value };
}
async function fillAll() {
  var results = [];
  for (var index = 0; index < ANSWERS.length; index += 1) {
    var answer = ANSWERS[index];
    try {
      if (answer.kind === 'choice') {
        var count = fillChoice(answer);
        results.push({
          id: answer.id,
          title: answer.title,
          ok: count >= 1,
          filled: count,
        });
        continue;
      }
      var result = await fillText(answer);
      results.push({
        id: answer.id,
        title: answer.title,
        ok: result.ok,
        value: result.value,
        reason: result.reason,
      });
    } catch (err) {
      results.push({
        id: answer.id,
        title: answer.title,
        ok: false,
        reason: err && err.message ? err.message : String(err),
      });
    }
  }
  return results;
}
`;

export function buildFillScript(
  answers: FormAnswer[],
  options?: { run?: boolean },
): string {
  const body = `var ANSWERS = ${JSON.stringify(answers)};\n${FILL_FUNCTIONS}`;
  if (options?.run === false) return body;
  return `${body}\nfillAll();`;
}

