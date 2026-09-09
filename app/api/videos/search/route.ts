import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['query', 'page', 'per_page', 'thumbsize', 'order', 'lq', 'format']);
const ORDERS = new Set(['latest', 'longest', 'shortest', 'top-rated', 'most-popular', 'top-weekly', 'top-monthly']);
const THUMB_SIZES = new Set(['small', 'medium', 'big']);

export async function GET(request: NextRequest) {
  const upstreamBase = process.env.API_URL?.trim() || process.env.VIDEO_SEARCH_API_URL?.trim();
  if (!upstreamBase) return NextResponse.json({ error: 'API_URL is not configured', videos: [], total_count: 0, total_pages: 0 }, { status: 503 });

  try {
    const url = new URL(upstreamBase);
    const input = request.nextUrl.searchParams;
    const query = input.get('query') || input.get('q') || 'all';
    const page = Number(input.get('page') || 1);
    const perPage = Number(input.get('per_page') || 30);
    const order = input.get('order') || 'latest';
    const thumbsize = input.get('thumbsize') || 'medium';
    const lq = Number(input.get('lq') || 1);

    if (!Number.isInteger(page) || page < 1 || page > 1_000_000) return NextResponse.json({ error: 'Invalid page' }, { status: 400 });
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 1000) return NextResponse.json({ error: 'Invalid per_page' }, { status: 400 });
    if (!ORDERS.has(order)) return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
    if (!THUMB_SIZES.has(thumbsize)) return NextResponse.json({ error: 'Invalid thumbsize' }, { status: 400 });
    if (![0, 1, 2].includes(lq)) return NextResponse.json({ error: 'Invalid lq value' }, { status: 400 });

    const values: Record<string, string> = { query, page: String(page), per_page: String(perPage), thumbsize, order, lq: String(lq), format: 'json' };
    for (const key of ALLOWED) if (values[key] !== undefined) url.searchParams.set(key, values[key]);

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
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to reach configured video API', videos: [], total_count: 0, total_pages: 0 }, { status: 502 });
  }
}
