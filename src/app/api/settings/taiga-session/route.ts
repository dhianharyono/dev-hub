import { NextResponse } from 'next/server';
import { saveSettings, getPublicSettings } from '@/lib/settings';
import { invalidateIntegrationCache } from '@/lib/integrations';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
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

    saveSettings({
      taigaToken: token.replace(/^["']+|["']+$/g, '').trim(),
      taigaRefresh: (refresh || '').replace(/^["']+|["']+$/g, '').trim(),
    });
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
