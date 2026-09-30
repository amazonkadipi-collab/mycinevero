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

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}

function parseBatch(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(Math.floor(parsed), 40)) : fallback;
}

async function fanOutIfNeeded(shard: { shard_kind: string; media_type: 'movie' | 'tv'; filters: Record<string, unknown>; next_page: number }, totalPages: number) {
  if (shard.next_page < Math.min(totalPages || 0, 500)) return 0;
  const year = Number(shard.filters.primary_release_year ?? shard.filters.first_air_date_year);
  if (!Number.isInteger(year) || totalPages < 500) return 0;

  if (shard.shard_kind === 'year') {
    const yearFilterKey = shard.media_type === 'movie' ? 'primary_release_year' : 'first_air_date_year';
    return createSyncShards(
      LANGUAGES.map((language, index) => ({
        shard_key: `${shard.media_type}:language_year:${year}:${language}`,
        media_type: shard.media_type,
        shard_kind: 'language_year' as const,
        priority: 72 - Math.min(index, 15),
        filters: {
          [yearFilterKey]: year,
          sort_by: 'popularity.desc',
          with_original_language: language,
        },
      })),
    );
  }

  if (shard.shard_kind === 'language_year') {
    const language = String(shard.filters.with_original_language || '');
    const yearFilterKey = shard.media_type === 'movie' ? 'primary_release_year' : 'first_air_date_year';
    return createSyncShards(
      GENRES.map((genreId, index) => ({
        shard_key: `${shard.media_type}:genre_language_year:${year}:${language}:${genreId}`,
        media_type: shard.media_type,
        shard_kind: 'genre_language_year' as const,
        priority: 50 - Math.min(index, 15),
        filters: {
          [yearFilterKey]: year,
          sort_by: 'popularity.desc',
          with_original_language: language,
          with_genres: genreId,
        },
      })),
    );
  }

  return 0;
}

export async function GET(request: Request) {
  if (!authorized(request)) return new NextResponse('Unauthorized', { status: 401 });

  const batch = parseBatch(process.env.CATALOG_DISCOVERY_BATCH, 24);
  const shards = await getSyncShards(batch);
  const runId = await startSyncRun('tmdb_catalog_discovery', shards.length);
  let pages = 0;
  let discovered = 0;
  let failed = 0;
  let fanOut = 0;

  for (const shard of shards) {
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
