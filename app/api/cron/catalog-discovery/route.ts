import { NextResponse } from 'next/server';
import { tmdbDiscoverPage } from '@/lib/tmdb';
import {
  createSyncShards,
  finishSyncRun,
  getSyncShards,
  lockSyncShard,
  startSyncRun,
  updateSyncShard,
  upsertDiscoveredTitles,
} from '@/lib/catalog-registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const LANGUAGES = ['en','ja','ko','hi','fr','es','de','it','pt','zh','tr','ru','ar','te','ta','ml','mr','id','th','pl'];
const GENRES = [28,12,16,35,80,18,27,9648,878,10749,53,36,99,10751,14,37,10402,10752];
const VOTE_BUCKETS: Array<[number, number | undefined]> = [
  [0, 10], [10, 50], [50, 200], [200, 1000], [1000, 5000], [5000, 25000], [25000, undefined],
];

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}

function parseBatch(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(Math.floor(parsed), 40)) : fallback;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

async function ensureMaximumYearCoverage() {
  const rows = [];
  for (let year = 1800; year <= 2100; year += 1) {
    rows.push(
      { shard_key: `movie:year:${year}`, media_type: 'movie' as const, shard_kind: 'year' as const, priority: 80, filters: { primary_release_year: year, sort_by: 'popularity.desc' } },
      { shard_key: `tv:year:${year}`, media_type: 'tv' as const, shard_kind: 'year' as const, priority: 80, filters: { first_air_date_year: year, sort_by: 'popularity.desc' } },
      { shard_key: `movie:anime_year:${year}`, media_type: 'movie' as const, shard_kind: 'anime_year' as const, priority: 90, filters: { primary_release_year: year, sort_by: 'popularity.desc', with_genres: '16', with_original_language: 'ja' } },
      { shard_key: `tv:anime_year:${year}`, media_type: 'tv' as const, shard_kind: 'anime_year' as const, priority: 90, filters: { first_air_date_year: year, sort_by: 'popularity.desc', with_genres: '16', with_original_language: 'ja' } },
    );
  }
  return createSyncShards(rows);
}

function dateFilterFor(mediaType: 'movie' | 'tv', year: number, month: number) {
  const prefix = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date';
  const lastDay = daysInMonth(year, month);
  return {
    [`${prefix}.gte`]: `${year}-${pad(month)}-01`,
    [`${prefix}.lte`]: `${year}-${pad(month)}-${lastDay}`,
  };
}

async function fanOutIfNeeded(
  shard: { shard_kind: string; media_type: 'movie' | 'tv'; filters: Record<string, unknown>; next_page: number },
  totalPages: number,
) {
  const cappedPages = Math.min(totalPages || 0, 500);
  if (cappedPages < 500 || shard.next_page < cappedPages) return 0;

  const directYear = Number(shard.filters.primary_release_year ?? shard.filters.first_air_date_year);
  const dateFilterKey = shard.media_type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte';
  const dateFilter = String(shard.filters[dateFilterKey] || '');
  const year = Number.isInteger(directYear) ? directYear : Number(dateFilter.slice(0, 4));
  if (!Number.isInteger(year) || year < 1800 || year > 2100) return 0;

  if (shard.shard_kind === 'year' || shard.shard_kind === 'anime_year') {
    const kind = shard.shard_kind === 'anime_year' ? 'anime_month' : 'month';
    return createSyncShards(Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        shard_key: `${shard.media_type}:${kind}:${year}:${pad(month)}`,
        media_type: shard.media_type,
        shard_kind: kind as 'month' | 'anime_month',
        priority: kind === 'anime_month' ? 88 : 76,
        filters: {
          ...dateFilterFor(shard.media_type, year, month),
          sort_by: 'popularity.desc',
          ...(shard.shard_kind === 'anime_year' ? { with_genres: 16, with_original_language: 'ja' } : {}),
        },
      };
    }));
  }

  const dateKey = shard.media_type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte';
  const month = Number(String(shard.filters[dateKey] || '').slice(5, 7));
  if (!Number.isInteger(month) || month < 1 || month > 12) return 0;

  if (shard.shard_kind === 'month' || shard.shard_kind === 'anime_month') {
    const kind = shard.shard_kind === 'anime_month' ? 'anime_language_month' : 'language_month';
    return createSyncShards(LANGUAGES.map((language, index) => ({
      shard_key: `${shard.media_type}:${kind}:${year}:${pad(month)}:${language}`,
      media_type: shard.media_type,
      shard_kind: kind as 'language_month' | 'anime_language_month',
      priority: kind === 'anime_language_month' ? 86 : 68 - Math.min(index, 15),
      filters: { ...shard.filters, with_original_language: language },
    })));
  }

  if (shard.shard_kind === 'language_month' || shard.shard_kind === 'anime_language_month') {
    const language = String(shard.filters.with_original_language || '');
    return createSyncShards(GENRES.map((genreId, index) => ({
      shard_key: `${shard.media_type}:genre_language_month:${year}:${pad(month)}:${language}:${genreId}`,
      media_type: shard.media_type,
      shard_kind: 'genre_language_month' as const,
      priority: 50 - Math.min(index, 15),
      filters: { ...shard.filters, with_genres: genreId, sort_by: 'popularity.desc' },
    })));
  }

  if (shard.shard_kind === 'genre_language_month') {
    const language = String(shard.filters.with_original_language || '');
    const genre = String(shard.filters.with_genres || '');
    return createSyncShards(VOTE_BUCKETS.map(([gte, lte], index) => ({
      shard_key: `${shard.media_type}:vote_bucket:${year}:${pad(month)}:${language}:${genre}:${gte}-${lte ?? 'max'}`,
      media_type: shard.media_type,
      shard_kind: 'vote_bucket' as const,
      priority: 30 - Math.min(index, 10),
      filters: {
        ...shard.filters,
        vote_count_gte: gte,
        ...(lte === undefined ? {} : { vote_count_lte: lte }),
        sort_by: 'popularity.desc',
      },
    })));
  }

  return 0;
}


export async function GET(request: Request) {
  if (!authorized(request)) return new NextResponse('Unauthorized', { status: 401 });

  const batch = parseBatch(process.env.CATALOG_DISCOVERY_BATCH, 40);
  await ensureMaximumYearCoverage();
  const shards = await getSyncShards(batch);
  const runId = await startSyncRun('tmdb_catalog_discovery', shards.length);
  let pages = 0;
  let discovered = 0;
  let failed = 0;
  let fanOut = 0;

  // Refresh the current frontier on every run; deep historical coverage is handled by shards.
  try {
    const { tmdbTrending, tmdbPopular, tmdbNowPlaying, tmdbUpcoming } = await import('@/lib/tmdb');
    const [trending, popularMovies, popularSeries, nowPlaying, upcoming] = await Promise.all([
      tmdbTrending('all', 'week'),
      tmdbPopular('movie'),
      tmdbPopular('tv'),
      tmdbNowPlaying(),
      tmdbUpcoming(),
    ]);
    const movieRefresh = [
      ...popularMovies.results,
      ...nowPlaying.results,
      ...upcoming.results,
      ...trending.results.filter(x => x.media_type === 'movie'),
    ];
    const seriesRefresh = [
      ...popularSeries.results,
      ...trending.results.filter(x => x.media_type === 'tv'),
    ];
    discovered += await upsertDiscoveredTitles(movieRefresh, 'movie', 'refresh-frontier');
    discovered += await upsertDiscoveredTitles(seriesRefresh, 'tv', 'refresh-frontier');
  } catch {
    // Historical shard processing must continue even if the live frontier refresh fails.
  }

  let shardCursor = 0;
  async function processShardBatch() {
    while (true) {
      const index = shardCursor++;
      if (index >= shards.length) return;
      const shard = shards[index];
      await lockSyncShard(shard.id);
      const page = shard.next_page;
      try {
        const data = await tmdbDiscoverPage(shard.media_type, page, shard.filters);
        const accepted = await upsertDiscoveredTitles(data.results || [], shard.media_type, shard.shard_key);
        const maxPage = Math.min(data.total_pages || 0, 500);
        const complete = page >= maxPage || maxPage === 0;

        discovered += accepted;
        pages += 1;
        fanOut += await fanOutIfNeeded(shard, data.total_pages || 0);

        await updateSyncShard(shard.id, {
          next_page: complete ? page : page + 1,
          completed: complete,
          pages_fetched: shard.pages_fetched + 1,
          items_seen: Number(shard.items_seen || 0) + (data.results?.length || 0),
          last_run_at: new Date().toISOString(),
          last_error: null,
          locked_until: null,
        });
      } catch (error) {
        failed += 1;
        await updateSyncShard(shard.id, {
          last_run_at: new Date().toISOString(),
          last_error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
          locked_until: null,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(6, shards.length) }, processShardBatch));

  await finishSyncRun(runId, {
    status: failed ? 'completed_with_errors' : 'completed',
    synced_count: discovered,
    error: failed ? `${failed} shard(s) failed` : null,
  });

  return NextResponse.json({
    ok: true,
    shards: shards.length,
    pages,
    discovered,
    failed,
    fanOut,
  });
}
