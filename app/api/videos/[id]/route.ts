import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function durationSeconds(value: string) {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function mapVideo(item: any) {
  const id = String(item?.id || '');
  const snippet = item?.snippet || {};
  const details = item?.contentDetails || {};
  const statistics = item?.statistics || {};
  const seconds = durationSeconds(String(details.duration || ''));
  return {
    id,
    title: snippet.title || 'Untitled video',
    description: snippet.description || '',
    keywords: Array.isArray(snippet.tags) ? snippet.tags.join(', ') : '',
    views: Number(statistics.viewCount || 0),
    likes: Number(statistics.likeCount || 0),
    rate: 0,
    length_min: Math.floor(seconds / 60),
    length_sec: seconds,
    duration: details.duration || '',
    added: snippet.publishedAt || '',
    uploader: snippet.channelTitle || '',
    author: snippet.channelTitle || '',
    channel_id: snippet.channelId || '',
    quality: details.definition || '',
    default_thumb: { src: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '' },
    thumbs: Object.values(snippet.thumbnails || {}).map((thumb: any) => ({ src: thumb?.url || '' })).filter((thumb: any) => thumb.src),
    thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
    embed: `https://www.youtube.com/embed/${encodeURIComponent(id)}`,
    provider: 'youtube',
  };
}

async function fetchJson(url: URL, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    const text = await response.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { body = null; }
    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'YouTube API is not configured. Set YOUTUBE_API_KEY in Vercel.' }, { status: 503 });

  try {
    const { id: rawId } = await params;
    const id = String(rawId || '').trim();
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return NextResponse.json({ error: 'Invalid YouTube video id' }, { status: 400 });

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,contentDetails,statistics');
    url.searchParams.set('id', id);
    url.searchParams.set('key', apiKey);

    const { response, body } = await fetchJson(url);
    if (!response.ok) return NextResponse.json({ error: body?.error?.message || `YouTube API returned HTTP ${response.status}` }, { status: 502 });
    const item = Array.isArray(body?.items) ? body.items.find((entry: any) => String(entry?.id) === id) : null;
    if (!item) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    return NextResponse.json(mapVideo(item), { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError' ? 'YouTube API took too long to respond.' : error instanceof Error ? error.message : 'Unable to reach YouTube API';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
