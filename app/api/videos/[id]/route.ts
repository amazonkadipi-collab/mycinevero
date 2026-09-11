import { NextRequest, NextResponse } from 'next/server';
import { getPortalSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

function buildEndpoint(base: string, path: string) {
  const baseUrl = new URL(base);
  if (baseUrl.protocol !== 'https:' && process.env.NODE_ENV === 'production') throw new Error('Configured API base URL must use HTTPS');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(baseUrl.toString());
  url.pathname = `${baseUrl.pathname.replace(/\/$/, '')}${normalizedPath}`.replace(/\/$/, '') + '/';
  return url;
}

function parseXmlVideo(xml: string) {
  const block = xml.match(/<video>([\s\S]*?)<\/video>/i)?.[1] || xml;
  const get = (name: string) => block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1]?.trim();
  const id = get('id');
  if (!id) return null;
  return { id, title: get('title'), keywords: get('keywords'), views: Number(get('views') || 0), rate: get('rate'), length_min: get('length_min'), length_sec: Number(get('length_sec') || 0), added: get('added'), embed: get('embed'), url: get('url') };
}

function parseBody(text: string, contentType: string | null) {
  const cleaned = text.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return null;
  try { return JSON.parse(cleaned) as unknown; } catch {
    if (contentType?.toLowerCase().includes('xml') || cleaned.startsWith('<')) return parseXmlVideo(cleaned);
    return null;
  }
}

function findVideo(body: unknown, id: string) {
  if (!body || typeof body !== 'object') return null;
  const data = body as { id?: string | number; videos?: Array<{ id?: string | number }> };
  if (Array.isArray(data.videos)) return data.videos.find((item) => String(item?.id || '').trim() === id) || null;
  return String(data.id || '').trim() === id ? body : null;
}

async function fetchWithTimeout(url: URL, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json, application/xml;q=0.9, text/xml;q=0.8', 'User-Agent': 'ElovexVideoProxy/1.0' },
      signal: controller.signal,
    });
    const text = await response.text();
    return { response, text };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const settings = await getPortalSettings();
    if (!settings.api_base_url || settings.api_base_url === 'SAMPLE_API_BASE_URL') {
      return NextResponse.json({ error: 'Video API is not configured.' }, { status: 503 });
    }

    const { id: rawId } = await params;
    const id = String(rawId || '').trim();
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
    }

    const timeoutMs = Math.max(15000, typeof settings.api_timeout_ms === 'number' ? settings.api_timeout_ms : 15000);
    const detailsUrl = buildEndpoint(settings.api_base_url, settings.api_details_path);
    detailsUrl.searchParams.set('id', id);
    detailsUrl.searchParams.set('format', 'json');
    detailsUrl.searchParams.set('thumbsize', 'small');

    const details = await fetchWithTimeout(detailsUrl, timeoutMs);
    if (details.response.ok) {
      const body = parseBody(details.text, details.response.headers.get('content-type'));
      const exact = findVideo(body, id);
      if (exact) return NextResponse.json(exact, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
    }

    // Some providers return search records for an ID but fail on their details endpoint.
    // Fall back to an exact-ID search so valid cards never become dead links.
    const searchUrl = buildEndpoint(settings.api_base_url, settings.api_search_path);
    searchUrl.searchParams.set('query', id);
    searchUrl.searchParams.set('page', '1');
    searchUrl.searchParams.set('per_page', '20');
    searchUrl.searchParams.set('order', settings.order || 'latest');
    searchUrl.searchParams.set('thumbsize', 'small');
    searchUrl.searchParams.set('gay', String(settings.gay || 0));
    searchUrl.searchParams.set('lq', String(settings.lq || 1));
    searchUrl.searchParams.set('format', 'json');

    const search = await fetchWithTimeout(searchUrl, timeoutMs);
    if (search.response.ok) {
      const body = parseBody(search.text, search.response.headers.get('content-type'));
      const exact = findVideo(body, id);
      if (exact) return NextResponse.json(exact, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
    }

    return NextResponse.json({ error: 'Video not found', videos: [] }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Video provider took too long to respond. Please retry.' }, { status: 504 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to reach video API' }, { status: 502 });
  }
}
