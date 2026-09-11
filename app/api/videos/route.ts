import { NextRequest, NextResponse } from 'next/server';
import { getPortalSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';
const EPORNER_BASE = 'https://www.eporner.com/api/v2';

function endpoint(base: string, path: string) {
  const url = new URL(base);
  const normalized = path.startsWith('/') ? path : `/${path}`;
  url.pathname = `${url.pathname.replace(/\/$/, '')}${normalized}`.replace(/\/$/, '') + '/';
  return url;
}

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams;
  const category = (input.get('category') || input.get('q') || 'all').trim().slice(0, 100);
  const page = Math.max(1, Number(input.get('page') || 1));
  const perPage = Math.min(50, Math.max(1, Number(input.get('limit') || input.get('per_page') || 50)));
  const settings = await getPortalSettings();
  const configuredBase = settings.api_base_url || EPORNER_BASE;
  const configuredPath = settings.api_search_path || '/video/search';
  const url = endpoint(configuredBase, configuredPath);
  for (const [key, value] of Object.entries({ query: category || 'all', page: String(page), per_page: String(perPage), order: settings.order || 'latest', thumbsize: 'small', gay: String(settings.gay || 0), lq: String(settings.lq || 1), format: 'json' })) url.searchParams.set(key, value);

  try {
    let response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json', 'User-Agent': 'ElovexVideoProxy/1.0' } });
    let text = await response.text();
    if ((!response.ok || !text.trim().startsWith('{')) && url.hostname !== 'www.eporner.com') {
      const fallback = endpoint(EPORNER_BASE, '/video/search');
      for (const [key, value] of url.searchParams) fallback.searchParams.set(key, value);
      response = await fetch(fallback, { cache: 'no-store', headers: { Accept: 'application/json', 'User-Agent': 'ElovexVideoProxy/1.0' } });
      text = await response.text();
    }
    if (!response.ok) return NextResponse.json({ error: `Video provider returned HTTP ${response.status}`, videos: [] }, { status: 502 });
    const data = JSON.parse(text.replace(/^\uFEFF/, '').trim());
    return NextResponse.json({ status: 'success', ...data }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to reach video provider', videos: [] }, { status: 502 });
  }
}
