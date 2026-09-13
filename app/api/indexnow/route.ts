import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'cinevero-indexnow-2026';
const INDEXNOW_SECRET = process.env.INDEXNOW_SECRET;

export async function POST(request: Request) {
  if (!INDEXNOW_SECRET) {
    return NextResponse.json({ error: 'INDEXNOW_SECRET is not configured' }, { status: 503 });
  }

  const authorization = request.headers.get('authorization');
  if (authorization !== `Bearer ${INDEXNOW_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { urls?: unknown } | null;
  const urls = Array.isArray(body?.urls)
    ? body.urls.filter((url): url is string => typeof url === 'string' && url.startsWith(`${SITE_URL}/`)).slice(0, 10000)
    : [];

  if (!urls.length) {
    return NextResponse.json({ error: 'Provide at least one Cinevero URL' }, { status: 400 });
  }

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: [...new Set(urls)],
    }),
    cache: 'no-store',
  });

  return NextResponse.json(
    { submitted: [...new Set(urls)].length, status: response.status },
    { status: response.ok ? 200 : response.status },
  );
}
