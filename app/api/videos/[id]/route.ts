import { NextRequest, NextResponse } from 'next/server';
import { getPortalSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

function buildEndpoint(base: string, path: string) {
  const baseUrl = new URL(base);
  if (baseUrl.protocol !== 'https:' && process.env.NODE_ENV === 'production') throw new Error('Configured API base URL must use HTTPS');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, baseUrl.origin + (baseUrl.pathname.endsWith('/') ? baseUrl.pathname : `${baseUrl.pathname}/`));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const settings = await getPortalSettings();
    if (settings.api_base_url === 'SAMPLE_API_BASE_URL') {
      return NextResponse.json({ error: 'Video API is not configured. Set a real authorized API base URL in Admin Settings.' }, { status: 503 });
    }

    const { id } = await params;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
    }

    const url = buildEndpoint(settings.api_base_url, settings.api_details_path);
    url.searchParams.set('id', id);
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
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json({ error: 'Upstream API did not return valid JSON' }, { status: 502 });
      }
      if (!response.ok) {
        return NextResponse.json({ error: `Upstream API returned HTTP ${response.status}` }, { status: 502 });
      }
      return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Video details API request timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to reach details API' }, { status: 502 });
  }
}
