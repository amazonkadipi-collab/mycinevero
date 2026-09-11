import { NextRequest, NextResponse } from 'next/server';
import { getPortalSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

const ORDERS = new Set(['latest', 'longest', 'shortest', 'top-rated', 'most-popular', 'top-weekly', 'top-monthly']);
const THUMB_SIZES = new Set(['small', 'medium', 'big']);
const responseCache = new Map<string, { expiresAt: number; body: unknown }>();
const CACHE_TTL_MS = 60_000;

function buildEndpoint(base: string, path: string) {
  const url = new URL(base);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  url.pathname = `${url.pathname.replace(/\/$/, '')}${normalizedPath}`;
  return url;
}

export async function GET(request: NextRequest) {
  const settings = await getPortalSettings();
  if (!settings.api_base_url || settings.api_base_url === 'SAMPLE_API_BASE_URL') {
    return NextResponse.json(
      { error: 'Video API is not configured. Set a valid API Base URL in Admin Settings.', videos: [], total_count: 0, total_pages: 0 },
      { status: 503 },
    );
  }

  try {
    const url = buildEndpoint(settings.api_base_url, settings.api_search_path);
    const input = request.nextUrl.searchParams;
    const category = (input.get('category') || '').trim().slice(0, 80);
    const query = (category || input.get('query') || input.get('q') || settings.query || 'all').trim().slice(0, 200) || 'all';
    const page = Number(input.get('page') || 1);
    const perPage = Number(input.get('per_page') || settings.per_page);
    const order = input.get('order') || settings.order;
    const thumbsize = input.get('thumbsize') || settings.thumbsize;
    const gay = Number(input.get('gay') ?? settings.gay);
    const lq = Number(input.get('lq') ?? settings.lq);

    if (!Number.isInteger(page) || page < 1 || page > 1_000_000) return NextResponse.json({ error: 'Invalid page' }, { status: 400 });
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 1000) return NextResponse.json({ error: 'Invalid per_page' }, { status: 400 });
    if (!ORDERS.has(order)) return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
    if (!THUMB_SIZES.has(thumbsize)) return NextResponse.json({ error: 'Invalid thumbsize' }, { status: 400 });
    if (![0, 1, 2].includes(gay)) return NextResponse.json({ error: 'Invalid secondary category value' }, { status: 400 });
    if (![0, 1, 2].includes(lq)) return NextResponse.json({ error: 'Invalid lq value' }, { status: 400 });

    url.searchParams.set('query', query);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('order', order);
    url.searchParams.set('thumbsize', thumbsize);
    url.searchParams.set('gay', String(gay));
    url.searchParams.set('lq', String(lq));
    url.searchParams.set('format', 'json');

    const cacheKey = url.toString();
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.body, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
    }

    const controller = new AbortController();
    const timeoutMs = typeof settings.api_timeout_ms === 'number' ? settings.api_timeout_ms : 10000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      const text = await response.text();
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = null; }
      if (!response.ok) {
        return NextResponse.json(
          { error: `Configured video API returned HTTP ${response.status}`, videos: [], total_count: 0, total_pages: 0 },
          { status: 502 },
        );
      }
      if (body === null) {
        return NextResponse.json(
          { error: 'Configured video API did not return valid JSON', videos: [], total_count: 0, total_pages: 0 },
          { status: 502 },
        );
      }
      responseCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, body });
      if (responseCache.size > 100) responseCache.delete(responseCache.keys().next().value as string);
      return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Configured video API timed out'
      : error instanceof Error
        ? error.message
        : 'Unable to reach configured video API';
    return NextResponse.json({ error: message, videos: [], total_count: 0, total_pages: 0 }, { status: 502 });
  }
}
