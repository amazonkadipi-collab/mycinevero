import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 60_000;
const responseCache = new Map<string, { expiresAt: number; body: unknown }>();
const ORDERS = new Set(['latest', 'longest', 'shortest', 'top-rated', 'most-popular', 'top-weekly', 'top-monthly', 'random']);
const QUALITY = new Set(['all', '360p', '480p', '720p', '1080p']);

function durationSeconds(value: string) {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function mapOrder(order: string) {
  if (order === 'latest') return 'date';
  if (order === 'most-popular' || order === 'top-monthly' || order === 'top-weekly') return 'viewCount';
  return 'relevance';
}

function mapDuration(duration: string | null) {
  if (duration === 'short') return 'short';
  if (duration === 'long' || duration === '10-20' || duration === '20plus') return 'long';
  return 'any';
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
    uploader: snippet.channelTitle || '',
    author: snippet.channelTitle || '',
    channel_id: snippet.channelId || '',
    published_at: snippet.publishedAt || '',
    added: snippet.publishedAt || '',
    views: Number(statistics.viewCount || 0),
    likes: Number(statistics.likeCount || 0),
    rate: 0,
    length_sec: seconds,
    length_min: Math.floor(seconds / 60),
    duration: details.duration || '',
    quality: details.definition || '',
    keywords: '',
    default_thumb: { src: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '' },
    thumbs: Object.values(snippet.thumbnails || {}).map((thumb: any) => ({ src: thumb?.url || '' })).filter((thumb: any) => thumb.src),
    thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
    embed: `https://www.youtube.com/embed/${encodeURIComponent(id)}`,
    provider: 'youtube',
  };
}

async function fetchYouTube(url: URL, timeoutMs: number) {
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

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API is not configured. Set YOUTUBE_API_KEY in Vercel.', videos: [], total_count: 0, total_pages: 0 }, { status: 503 });
  }

  try {
    const input = request.nextUrl.searchParams;
    const query = (input.get('query') || input.get('q') || input.get('category') || '').trim().slice(0, 200);
    const pageToken = (input.get('pageToken') || '').trim();
    const perPage = Math.min(50, Math.max(1, Number(input.get('per_page') || 50)));
    const order = input.get('order') || 'latest';
    const duration = input.get('duration') || 'all';
    const quality = input.get('quality') || 'all';
    const regionCode = (input.get('regionCode') || 'US').toUpperCase();

    if (!ORDERS.has(order)) return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
    if (!QUALITY.has(quality)) return NextResponse.json({ error: 'Invalid quality' }, { status: 400 });
    if (duration !== 'all' && !['short', 'medium', 'long', '10-20', '20plus'].includes(duration)) return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', String(perPage));
    url.searchParams.set('order', mapOrder(order));
    url.searchParams.set('videoDuration', mapDuration(duration));
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('videoSyndicated', 'true');
    url.searchParams.set('safeSearch', 'moderate');
    url.searchParams.set('regionCode', regionCode);
    url.searchParams.set('key', apiKey);
    if (query && query.toLowerCase() !== 'all') url.searchParams.set('q', query);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const cacheKey = url.toString().replace(apiKey, 'REDACTED');
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return NextResponse.json(cached.body, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });

    const { response, body } = await fetchYouTube(url, 12000);
    if (!response.ok) {
      const message = body?.error?.message || `YouTube API returned HTTP ${response.status}`;
      return NextResponse.json({ error: message, videos: [], total_count: 0, total_pages: 0 }, { status: response.status === 403 ? 502 : 502 });
    }

    const items = Array.isArray(body?.items) ? body.items : [];
    const ids = items.map((item: any) => item?.id?.videoId).filter(Boolean);
    let detailsById = new Map<string, any>();

    if (ids.length) {
      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailsUrl.searchParams.set('part', 'snippet,contentDetails,statistics');
      detailsUrl.searchParams.set('id', ids.join(','));
      detailsUrl.searchParams.set('key', apiKey);
      const detailsResult = await fetchYouTube(detailsUrl, 12000);
      if (detailsResult.response.ok && Array.isArray(detailsResult.body?.items)) {
        detailsById = new Map(detailsResult.body.items.map((item: any) => [String(item.id), item]));
      }
    }

    let videos = items.map((item: any) => {
      const id = String(item?.id?.videoId || '');
      return mapVideo(detailsById.get(id) || { id, snippet: item?.snippet || {} });
    }).filter((video: any) => video.id);

    if (quality !== 'all') videos = videos.filter((video: any) => String(video.quality).toLowerCase() === quality.toLowerCase());
    const date = input.get('date') || 'all';
    if (date !== 'all') {
      const days = date === '3d' ? 3 : date === 'week' ? 7 : date === 'month' ? 30 : date === '3m' ? 90 : 180;
      const cutoff = Date.now() - days * 86400000;
      videos = videos.filter((video: any) => Date.parse(video.added) >= cutoff);
    }
    if (duration === 'medium') videos = videos.filter((video: any) => video.length_sec > 180 && video.length_sec <= 600);
    if (duration === '10-20') videos = videos.filter((video: any) => video.length_sec >= 600 && video.length_sec <= 1200);
    if (duration === '20plus') videos = videos.filter((video: any) => video.length_sec > 1200);

    const result = {
      videos,
      total_count: Number(body?.pageInfo?.totalResults || videos.length),
      total_pages: body?.nextPageToken ? 2 : 1,
      next_page_token: body?.nextPageToken || '',
      prev_page_token: body?.prevPageToken || '',
      page: Number(input.get('page') || 1),
      per_page: perPage,
      provider: 'youtube',
    };
    responseCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, body: result });
    if (responseCache.size > 100) responseCache.delete(responseCache.keys().next().value as string);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError' ? 'YouTube API took too long to respond.' : error instanceof Error ? error.message : 'Unable to reach YouTube API';
    return NextResponse.json({ error: message, videos: [], total_count: 0, total_pages: 0 }, { status: 502 });
  }
}
