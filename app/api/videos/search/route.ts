import { NextRequest, NextResponse } from 'next/server';
import { getPortalSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

const ORDERS = new Set(['latest', 'longest', 'shortest', 'top-rated', 'most-popular', 'top-weekly', 'top-monthly', 'random']);
const THUMB_SIZES = new Set(['small', 'medium', 'big']);
const responseCache = new Map<string, { expiresAt: number; body: unknown }>();
const CACHE_TTL_MS = 60_000;
const EPORNER_BASE = 'https://www.eporner.com/api/v2';

function buildEndpoint(base: string, path: string) {
  const url = new URL(base);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  url.pathname = `${url.pathname.replace(/\/$/, '')}${normalizedPath}`.replace(/\/$/, '') + '/';
  return url;
}

function parseXmlVideos(xml: string) {
  const videos = [...xml.matchAll(/<video>([\s\S]*?)<\/video>/gi)].map((match) => {
    const block = match[1];
    const get = (name: string) => block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1]?.trim();
    const id = get('id');
    if (!id) return null;
    return { id, title: get('title'), views: Number(get('views') || 0), rate: get('rate'), length_sec: Number(get('length_sec') || 0), length_min: get('length_min'), url: get('url'), embed: get('embed'), keywords: get('keywords') };
  }).filter(Boolean);
  const value = (name: string) => Number(xml.match(new RegExp(`<${name}>([\\d.]+)<\\/${name}>`, 'i'))?.[1] || 0);
  return { count: value('count'), start: value('start'), per_page: value('per_page'), page: value('page'), total_count: value('total_count'), total_pages: value('total_pages'), videos };
}

function parseUpstreamBody(text: string, contentType: string | null) {
  const cleaned = text.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return null;
  try { return JSON.parse(cleaned) as unknown; } catch {
    return contentType?.toLowerCase().includes('xml') || cleaned.startsWith('<') ? parseXmlVideos(cleaned) : null;
  }
}

function addSearchParams(url: URL, query: string, page: number, perPage: number, order: string, thumbsize: string, gay: number, lq: number) {
  url.searchParams.set('query', query); url.searchParams.set('page', String(page)); url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('order', order); url.searchParams.set('thumbsize', thumbsize); url.searchParams.set('gay', String(gay)); url.searchParams.set('lq', String(lq)); url.searchParams.set('format', 'json');
  return url;
}
function hasVideos(body: unknown) { return Boolean(body && typeof body === 'object' && Array.isArray((body as { videos?: unknown[] }).videos) && (body as { videos: unknown[] }).videos.length > 0); }

async function fetchUpstream(url: URL, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json, application/xml;q=0.9, text/xml;q=0.8', 'User-Agent': 'ElovexVideoProxy/1.1' },
      signal: controller.signal,
    });
    return { response, text: await response.text() };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const settings = await getPortalSettings();
  if (!settings.api_base_url || settings.api_base_url === 'SAMPLE_API_BASE_URL') {
    return NextResponse.json({ error: 'Video API is not configured. Set a valid API Base URL in Admin Settings.', videos: [], total_count: 0, total_pages: 0 }, { status: 503 });
  }

  try {
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

    let url = addSearchParams(buildEndpoint(settings.api_base_url, settings.api_search_path), query, page, perPage, order, thumbsize, gay, lq);
    const cacheKey = url.toString();
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.body, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
    }

    const timeoutMs = Math.max(15000, typeof settings.api_timeout_ms === 'number' ? settings.api_timeout_ms : 15000);
    let result = await fetchUpstream(url, timeoutMs);
    let body: unknown = parseUpstreamBody(result.text, result.response.headers.get('content-type'));

    // A provider can intermittently return HTML/empty output or a non-JSON response.
    // Retry with a fresh AbortController so a timed-out first attempt cannot poison fallback requests.
    if (body === null && result.response.ok) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      result = await fetchUpstream(url, timeoutMs);
      body = parseUpstreamBody(result.text, result.response.headers.get('content-type'));
    }

    if (result.response.ok && !hasVideos(body) && (url.hostname !== 'www.eporner.com' || url.pathname !== '/api/v2/video/search/')) {
      url = addSearchParams(buildEndpoint(EPORNER_BASE, '/video/search'), query, page, perPage, order, thumbsize, gay, lq);
      result = await fetchUpstream(url, timeoutMs);
      body = parseUpstreamBody(result.text, result.response.headers.get('content-type'));
    }

    if (!result.response.ok) {
      return NextResponse.json({ error: `Configured video API returned HTTP ${result.response.status}`, videos: [], total_count: 0, total_pages: 0 }, { status: 502 });
    }
    if (body === null) {
      return NextResponse.json({ error: 'Video provider temporarily returned an unsupported response. Please retry shortly.', videos: [], total_count: 0, total_pages: 0 }, { status: 502 });
    }

    responseCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, body });
    if (responseCache.size > 100) responseCache.delete(responseCache.keys().next().value as string);
    return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Video provider took too long to respond. Please retry.'
      : error instanceof Error
        ? error.message
        : 'Unable to reach configured video API';
    return NextResponse.json({ error: message, videos: [], total_count: 0, total_pages: 0 }, { status: 502 });
  }
}
