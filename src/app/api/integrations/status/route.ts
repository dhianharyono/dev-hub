import { NextResponse } from 'next/server';
import { checkIntegrationsStatus } from '@/lib/integrations';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === '1';
    const status = await checkIntegrationsStatus(force);
    return NextResponse.json(status);
  } catch (err) {
    return errorResponse(err);
  }
}
