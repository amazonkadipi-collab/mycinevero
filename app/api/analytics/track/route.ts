import { NextResponse } from 'next/server';
import { recordAnalytics } from '@/lib/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = typeof body.path === 'string' ? body.path : '/';
    if (!path.startsWith('/') || path.startsWith('//') || path.length > 500) return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    await recordAnalytics(request, { path, referrer: typeof body.referrer === 'string' ? body.referrer : '' });
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
