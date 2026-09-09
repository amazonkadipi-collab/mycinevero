import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const upstreamBase = process.env.API_DETAILS_URL?.trim();
  if (!upstreamBase) return NextResponse.json({ error: 'API_DETAILS_URL is not configured' }, { status: 503 });
  try {
    const { id } = await params;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
    const url = new URL(upstreamBase);
    url.searchParams.set('id', id);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller.signal });
      const text = await response.text();
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = { error: 'Upstream API did not return valid JSON' }; }
      if (!response.ok) return NextResponse.json({ error: `Upstream API returned HTTP ${response.status}` }, { status: 502 });
      return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
    } finally { clearTimeout(timeout); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to reach details API' }, { status: 502 }); }
}
