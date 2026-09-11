import { NextResponse } from 'next/server';
import { getPortalSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPortalSettings();
    const base = new URL(settings.api_base_url);
    base.pathname = `${base.pathname.replace(/\/$/, '')}/video/removed`;
    base.searchParams.set('format', 'json');
    const response = await fetch(base, { next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ error: `Upstream API returned HTTP ${response.status}`, ids: [] }, { status: 502 });
    const data = await response.json();
    const ids = Array.isArray(data) ? data.map((entry) => typeof entry === 'string' ? entry : entry?.id).filter(Boolean) : [];
    return NextResponse.json({ count: ids.length, ids }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to reach removed videos API', ids: [] }, { status: 502 });
  }
}
