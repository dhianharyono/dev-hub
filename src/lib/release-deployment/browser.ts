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

function escapeForAppleScript(source: string): string {
  return source.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function runAppleScript(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'osascript',
      ['-e', script],
      { maxBuffer: 20 * 1024 * 1024, timeout: 60_000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error((stderr || error.message).trim()));
          return;
        }
        resolve(String(stdout).trim());
      },
    );
  });
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
  const origin = 'https://forms.office.com';
  const formMarker = 'AUuJHtOwQk6t9xkohyiixwSkjYOhAcFKuJZ6k2T9OEpUQjNLUU5SQzYxRFFXQThTOEg4TjdPWjM5MSQlQCN0PWcu';
  const requestId = `__rn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const scriptBase64 = Buffer.from(buildFillScript(answers), 'utf8').toString('base64');
  const ids = JSON.stringify(answers.map((answer) => answer.id));

  const loader = `(function(){
    var rId = '${requestId}';
    window[rId] = null;
    var ids = ${ids};
    var tries = 0;
    function hasField() {
      return ids.some(function (id) {
        return document.getElementById(id)
          || document.querySelector('[data-automation-id="' + id + '"]')
          || document.querySelector('[id^="' + id + '"]');
      });
    }
    function run() {
      try {
        var code = decodeURIComponent(escape(atob('${scriptBase64}')));
        var result = eval(code);
        window[rId] = JSON.stringify({ results: result });
      } catch (err) {
        window[rId] = JSON.stringify({ error: err && err.message ? err.message : String(err) });
      }
    }
    function wait() {
      if (!hasField() && tries < 40) {
        tries += 1;
        setTimeout(wait, 500);
        return;
      }
      setTimeout(run, 600);
    }
    wait();
  })()`;

  const appleScript = `
    tell application "Google Chrome"
      set targetTab to missing value
      repeat with w in windows
        repeat with t in tabs of w
          if URL of t contains "${formMarker}" then
            set targetTab to t
            exit repeat
          end if
        end repeat
        if targetTab is not missing value then exit repeat
      end repeat

      if targetTab is missing value then
        if (count of windows) is 0 then
          make new window
        end if
        set targetTab to make new tab at end of tabs of window 1 with properties {URL:"${cleanUrl}"}
        set maxWait to 40
        repeat while maxWait > 0
          delay 0.5
          set maxWait to maxWait - 0.5
          if (loading of targetTab is false) and (URL of targetTab starts with "${origin}") then
            exit repeat
          end if
        end repeat
      end if

      execute targetTab javascript "${escapeForAppleScript(loader)}"

      set pollCount to 300
      repeat while pollCount > 0
        delay 0.1
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

  let output: string;
  try {
    output = await runAppleScript(appleScript);
  } catch (err) {
    throw new Error(
      `Gagal mengakses Google Chrome: ${(err as Error).message}. ` +
        'Pastikan Chrome berjalan, sudah login Microsoft, dan "Allow JavaScript from Apple Events" aktif.',
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
