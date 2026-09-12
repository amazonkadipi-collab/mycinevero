import { NextRequest, NextResponse } from 'next/server';
import { tmdbTrending, tmdbPopular, tmdbNowPlaying, tmdbUpcoming, tmdbDetails } from '@/lib/tmdb';
import { upsertTmdbTitle } from '@/lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const [trending, movies, series, nowPlaying, upcoming] = await Promise.all([
      tmdbTrending('all', 'week'), tmdbPopular('movie'), tmdbPopular('tv'), tmdbNowPlaying(), tmdbUpcoming(),
    ]);
    const items = new Map<string, { id: number; type: 'movie' | 'tv' }>();
    for (const item of [...trending.results, ...movies.results, ...series.results, ...nowPlaying.results, ...upcoming.results]) {
      const type = item.media_type || (item.name ? 'tv' : 'movie');
      if (type === 'movie' || type === 'tv') items.set(`${type}:${item.id}`, { id: item.id, type });
    }
    let synced = 0;
    for (const item of items.values()) {
      try { const detail = await tmdbDetails(item.type, item.id); await upsertTmdbTitle(detail, item.type); synced++; } catch { /* continue with remaining titles */ }
    }
    return NextResponse.json({ ok: true, requested: items.size, synced, site: 'Watch Movies 4' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'TMDB sync failed' }, { status: 500 });
  }
}
