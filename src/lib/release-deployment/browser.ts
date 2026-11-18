import 'server-only';
import { execFile } from 'node:child_process';
import type { FormAnswer } from './form';
import { buildFillScript } from './fill-script';

export interface AutofillFieldResult {
  id: string;
  title: string;
  ok: boolean;
  value?: string;
  filled?: number;
  reason?: string;
}

export interface AutofillResult {
  results: AutofillFieldResult[];
}

const CHROME_APP = 'Google Chrome';
const FORM_MARKER =
  'AUuJHtOwQk6t9xkohyiixwSkjYOhAcFKuJZ6k2T9OEpUQjNLUU5SQzYxRFFXQThTOEg4TjdPWjM5MSQlQCN0PWcu';
const APPLESCRIPT_TIMEOUT_MS = 120_000;

interface CommandOutcome {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  timedOut: boolean;
  spawnError: string | null;
}

function runCommand(
  command: string,
  args: string[],
  timeout: number,
): Promise<CommandOutcome> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      { maxBuffer: 32 * 1024 * 1024, timeout },
      (error, stdout, stderr) => {
        const err = error as
          | (Error & { code?: number | string; killed?: boolean; signal?: string })
          | null;
        resolve({
          stdout: String(stdout ?? '').trim(),
          stderr: String(stderr ?? '').trim(),
          code: typeof err?.code === 'number' ? err.code : err ? 1 : 0,
          signal: err?.signal ?? null,
          timedOut: Boolean(err?.killed),
          spawnError:
            err && typeof err.code === 'string' ? `${err.code}: ${err.message}` : null,
        });
      },
    );
  });
}

/** Menjelaskan kegagalan osascript dengan sebab asli, bukan pesan generik. */
function describeAppleScriptFailure(outcome: CommandOutcome): string {
  const detail =
    outcome.stderr ||
    outcome.spawnError ||
    (outcome.timedOut
      ? `osascript melewati batas waktu ${APPLESCRIPT_TIMEOUT_MS / 1000} detik`
      : `osascript gagal tanpa stderr (exit ${outcome.code ?? 'null'})`);

  if (/-1743|Not authorized to send Apple events|not allowed assistive access/i.test(detail)) {
    return (
      `${detail}. Izin Automation macOS belum aktif untuk proses dev-hub. ` +
      'Buka System Settings > Privacy & Security > Automation, aktifkan Google Chrome untuk proses dev-hub (node/PM2), lalu coba lagi.'
    );
  }
  if (/turned off|executing JavaScript|JavaScript.*not (allowed|enabled)/i.test(detail)) {
    return (
      `${detail}. Aktifkan di Chrome: View > Developer > Allow JavaScript from Apple Events, lalu coba lagi.`
    );
  }
  return detail;
}

function escapeForAppleScript(source: string): string {
  return source.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function ensureChromeRunning(): Promise<void> {
  const probe = await runCommand('pgrep', ['-x', CHROME_APP], 5_000);
  if (probe.code !== 0) {
    throw new Error(
      'Google Chrome tidak berjalan. Buka Chrome, login Microsoft, lalu coba lagi.',
    );
  }
}

async function findFormTab(): Promise<'FOUND' | 'NO_TAB'> {
  const outcome = await runCommand(
    'osascript',
    [
      '-e',
      `tell application "${CHROME_APP}"
        repeat with w in windows
          repeat with t in tabs of w
            if URL of t contains "${FORM_MARKER}" then return "FOUND"
          end repeat
        end repeat
        return "NO_TAB"
      end tell`,
    ],
    30_000,
  );
  if (outcome.code !== 0) {
    throw new Error(describeAppleScriptFailure(outcome));
  }
  return outcome.stdout === 'FOUND' ? 'FOUND' : 'NO_TAB';
}

async function waitForFormTab(): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    if ((await findFormTab()) === 'FOUND') return;
  }
  throw new Error(
    'Tab form Deployment tidak terbuka di Google Chrome. Pastikan Chrome berjalan dan coba lagi.',
  );
}

function buildRunnerScript(answers: FormAnswer[], requestId: string): string {
  const fillScript = buildFillScript(answers, { run: false });
  return `(function(){
    var rId = '${requestId}';
    window[rId] = '';
    ${fillScript}
    function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
    function pageFingerprint() {
      return Array.prototype.slice
        .call(document.querySelectorAll('[data-automation-id=questionTitle]'))
        .map(function (node) { return (node.innerText || '').trim(); })
        .sort()
        .join('|');
    }
    async function waitForPageChange(before, timeout) {
      var waited = 0;
      while (waited < timeout) {
        await sleep(250);
        waited += 250;
        if (pageFingerprint() !== before) return true;
      }
      return false;
    }
    function hasQuestions() {
      return document.querySelectorAll('[data-automation-id=questionItem]').length > 0;
    }
    async function waitReady(timeout) {
      var waited = 0;
      while (!hasQuestions() && waited < timeout) {
        await sleep(300);
        waited += 300;
      }
    }
    async function rewind() {
      var guard = 8;
      while (guard > 0) {
        var back = document.querySelector('[data-automation-id=backButton]');
        if (!back) return;
        back.click();
        await sleep(900);
        await waitReady(4000);
        guard -= 1;
      }
    }
    async function run() {
      var merged = {};
      var order = [];
      var pages = 0;
      await waitReady(15000);
      await rewind();
      while (pages < 8) {
        pages += 1;
        await waitReady(8000);
        var results = await fillAll();
        results.forEach(function (item) {
          if (!merged[item.id]) {
            merged[item.id] = item;
            order.push(item.id);
          } else if (item.ok) {
            merged[item.id] = item;
          }
        });
        var next = document.querySelector('[data-automation-id=nextButton]');
        if (!next) break;
        var before = pageFingerprint();
        next.click();
        var moved = await waitForPageChange(before, 8000);
        if (!moved) break;
      }
      window[rId] = JSON.stringify({
        pages: pages,
        results: order.map(function (id) { return merged[id]; }),
      });
    }
    run().catch(function (err) {
      window[rId] = JSON.stringify({
        error: err && err.message ? err.message : String(err),
      });
    });
  })()`;
}

function buildFillAppleScript(
  url: string,
  answers: FormAnswer[],
  requestId: string,
): string {
  const runner = escapeForAppleScript(buildRunnerScript(answers, requestId));
  return `
    tell application "${CHROME_APP}"
      set winIndex to 0
      set tabIndex to 0
      set wCount to 0
      repeat with w in windows
        set wCount to wCount + 1
        set tCount to 0
        repeat with t in tabs of w
          set tCount to tCount + 1
          if URL of t contains "${FORM_MARKER}" then
            set winIndex to wCount
            set tabIndex to tCount
            exit repeat
          end if
        end repeat
        if winIndex > 0 then exit repeat
      end repeat

      if winIndex is 0 then return "NO_TAB"

      set active tab index of window winIndex to tabIndex
      set index of window winIndex to 1
      set targetTab to tab tabIndex of window winIndex

      set maxWait to 60
      repeat while maxWait > 0
        if (loading of targetTab is false) then exit repeat
        delay 0.5
        set maxWait to maxWait - 1
      end repeat

      try
        set jsProbe to execute targetTab javascript "1+1"
      on error errMsg number errNum
        return "JS_ERROR:" & errMsg & " (" & errNum & ")"
      end try
      if jsProbe is missing value then return "JS_ERROR:probe kosong"

      execute targetTab javascript "${runner}"

      set pollCount to 240
      repeat while pollCount > 0
        delay 0.25
        set pollCount to pollCount - 1
        set checkRes to execute targetTab javascript "window['${requestId}']"
        if checkRes is not "" and checkRes is not missing value then
          execute targetTab javascript "delete window['${requestId}']"
          return checkRes
        end if
      end repeat
      return "TIMEOUT"
    end tell
  `;
}

/**
 * Mengisi form Deployment di tab Google Chrome yang sedang login Microsoft.
 * Tidak menekan tombol submit; pengguna tetap memeriksa dan mengirim sendiri.
 */
export async function fillDeploymentFormInChrome(
  url: string,
  answers: FormAnswer[],
): Promise<AutofillResult> {
  if (process.platform !== 'darwin') {
    throw new Error('Autofill browser hanya didukung pada macOS.');
  }
  if (answers.length === 0) {
    throw new Error('Tidak ada field yang bisa diisi.');
  }

  const cleanUrl = url.replace(/\/+$/, '');
  const requestId = `__rn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await ensureChromeRunning();

  if ((await findFormTab()) === 'NO_TAB') {
    const opened = await runCommand(
      'open',
      ['-a', CHROME_APP, cleanUrl],
      15_000,
    );
    if (opened.code !== 0) {
      throw new Error(
        `Gagal membuka Google Chrome: ${
          opened.stderr || opened.spawnError || `exit ${opened.code}`
        }.`,
      );
    }
    await waitForFormTab();
  }

  const outcome = await runCommand(
    'osascript',
    ['-e', buildFillAppleScript(cleanUrl, answers, requestId)],
    APPLESCRIPT_TIMEOUT_MS,
  );

  if (outcome.code !== 0) {
    throw new Error(
      `Gagal mengisi form di Google Chrome: ${describeAppleScriptFailure(outcome)}`,
    );
  }

  const output = outcome.stdout;
  if (output === 'NO_TAB') {
    throw new Error(
      'Tab form Deployment tidak ditemukan di Google Chrome. Buka form lalu coba lagi.',
    );
  }
  if (output.startsWith('JS_ERROR:')) {
    throw new Error(
      `Chrome menolak menjalankan JavaScript: ${output.slice(9)}. ` +
        'Aktifkan View > Developer > Allow JavaScript from Apple Events, lalu coba lagi.',
    );
  }
  if (output === 'TIMEOUT') {
    throw new Error(
      'Timeout menunggu form Deployment siap di Chrome. Pastikan sudah login Microsoft lalu coba lagi.',
    );
  }

  let parsed: AutofillResult & { error?: string };
  try {
    parsed = JSON.parse(output) as AutofillResult & { error?: string };
  } catch {
    throw new Error(`Respon browser tidak valid: ${output.slice(0, 200)}`);
  }
  if (parsed.error) {
    throw new Error(`Autofill gagal: ${parsed.error}`);
  }
  if (!Array.isArray(parsed.results)) {
    return { results: [] };
  }
  return { results: parsed.results };
}
