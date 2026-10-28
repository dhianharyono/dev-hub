import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { saveSettings, getPublicSettings, getSettings } from '@/lib/settings';
import { invalidateIntegrationCache } from '@/lib/integrations';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET() {
  if (process.platform !== 'darwin') {
    return NextResponse.json(
      { error: 'Fitur deteksi Chrome otomatis hanya tersedia di macOS.' },
      { status: 400 },
    );
  }

  const s = getSettings();
  const baseUrl = (s.taigaBaseUrl || 'https://projects.digitaltelkom.id').replace(/\/+$/, '');

  const script = `
    tell application "Google Chrome"
      repeat with w in windows
        repeat with t in tabs of w
          if URL of t starts with "${baseUrl}" then
            set res to execute t javascript "
              (function() {
                var title = document.title;
                if (title.indexOf('Just a moment') !== -1 || title.indexOf('Tunggu sebentar') !== -1) {
                  return JSON.stringify({ error: 'CLOUDFLARE_CHALLENGE' });
                }
                var t = localStorage.getItem('token') || localStorage.token;
                var r = localStorage.getItem('refresh') || localStorage.refresh;
                if (!t && localStorage.userInfo) {
                  try {
                    var u = JSON.parse(localStorage.userInfo);
                    t = u.auth_token || u.token;
                    r = r || u.refresh;
                  } catch(e) {}
                }
                return JSON.stringify({
                  token: t ? String(t).replace(/^[\\"]+|[\\"]+$/g, '').trim() : null,
                  refresh: r ? String(r).replace(/^[\\"]+|[\\"]+$/g, '').trim() : null,
                  url: window.location.origin
                });
              })()
            "
            return res
          end if
        end repeat
      end repeat
      return "TAB_NOT_FOUND"
    end tell
  `;

  try {
    const rawOutput = await new Promise<string>((resolve, reject) => {
      execFile('osascript', ['-e', script], { timeout: 10000 }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr?.trim() || err.message));
        resolve(stdout.trim());
      });
    });

    if (rawOutput === 'TAB_NOT_FOUND') {
      return NextResponse.json(
        {
          error:
            'Tab Taiga (projects.digitaltelkom.id) tidak ditemukan di Google Chrome. Silakan buka website Taiga di Chrome terlebih dahulu.',
        },
        { status: 404 },
      );
    }

    const parsed = JSON.parse(rawOutput);
    if (parsed.error === 'CLOUDFLARE_CHALLENGE') {
      return NextResponse.json(
        {
          error:
            'Tab Taiga di Chrome sedang menunggu verifikasi keamanan Cloudflare ("Tunggu sebentar..."). Buka tab Taiga di Chrome Anda dan selesaikan verifikasinya terlebih dahulu.',
        },
        { status: 403 },
      );
    }

    if (!parsed.token) {
      return NextResponse.json(
        {
          error:
            'Sesi login tidak ditemukan di tab Taiga. Pastikan Anda sudah login ke Taiga di browser Chrome.',
        },
        { status: 400 },
      );
    }

    saveSettings({
      taigaToken: parsed.token,
      ...(parsed.refresh ? { taigaRefresh: parsed.refresh } : {}),
      ...(parsed.url ? { taigaBaseUrl: parsed.url } : {}),
    });
    invalidateIntegrationCache();

    return NextResponse.json({
      ok: true,
      message: 'Sesi Taiga berhasil diambil langsung dari Google Chrome!',
      settings: getPublicSettings(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let token = '';
    let refresh = '';

    if (typeof body.session === 'string') {
      try {
        const parsed = JSON.parse(body.session);
        token = parsed.token || '';
        refresh = parsed.refresh || '';
      } catch {
        token = body.session.trim();
      }
    } else if (body.token) {
      token = body.token;
      refresh = body.refresh || '';
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token Taiga tidak ditemukan dalam request.' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }

    const newSettings: Record<string, string> = {
      taigaToken: token.replace(/^["']+|["']+$/g, '').trim(),
      taigaRefresh: (refresh || '').replace(/^["']+|["']+$/g, '').trim(),
    };
    if (typeof body.baseUrl === 'string' && body.baseUrl.trim()) {
      newSettings.taigaBaseUrl = body.baseUrl.trim().replace(/\/+$/, '');
    }
    saveSettings(newSettings);
    invalidateIntegrationCache();

    return NextResponse.json(
      {
        ok: true,
        message: 'Token Taiga berhasil disimpan secara otomatis!',
        settings: getPublicSettings(),
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
}
