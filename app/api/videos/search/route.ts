import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Generic server-side proxy for a configured video-search API. */
export async function GET(request: NextRequest) {
  const upstreamBase = process.env.API_URL?.trim() || process.env.VIDEO_SEARCH_API_URL?.trim();

  if (!upstreamBase) {
    return NextResponse.json({ error: 'API_URL is not configured', videos: [], total: 0, totalPages: 0 }, { status: 503 });
  }

  try {
    const upstreamUrl = new URL(upstreamBase);
    const sourceParams = request.nextUrl.searchParams;

    for (const key of ['q', 'query', 'page', 'limit', 'per_page', 'order', 'thumbsize', 'category', 'gay', 'lq', 'format']) {
      const value = sourceParams.get(key);
      if (value !== null && value !== '') upstreamUrl.searchParams.set(key, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(upstreamUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type') ?? '';
      const body = contentType.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) {
        return NextResponse.json({ error: `Upstream API returned HTTP ${response.status}`, details: typeof body === 'string' ? body.slice(0, 500) : body, videos: [], total: 0, totalPages: 0 }, { status: 502 });
      }

      return NextResponse.json(body, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Unable to reach the configured video API', details: error instanceof Error ? error.message : 'Unknown upstream error', videos: [], total: 0, totalPages: 0 }, { status: 502 });
  }
}
