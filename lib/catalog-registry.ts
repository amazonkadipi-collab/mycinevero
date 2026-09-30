import { createHash } from 'node:crypto';
import { slugify, type TmdbDiscoverOptions, type TmdbMediaType, type TmdbTitle } from './tmdb';
import { evaluateQualityGate } from './quality-gate';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const SITEMAP_PAGE_SIZE = 1000;
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export type CatalogCategory = 'movies' | 'series' | 'anime';

type CatalogRow = {
  id: string;
  tmdb_id: number;
  media_type: TmdbMediaType;
  slug: string;
  title: string;
  overview: string | null;
  poster_path: string | null;
  raw: TmdbTitle | null;
  indexable: boolean;
  quality_state: string;
  quality_score: number;
  quality_attempts: number;
  quality_next_attempt_at: string | null;
  content_hash: string | null;
  last_synced_at?: string | null;
};

function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase catalog storage is not configured');
  }
}

async function supabaseRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: T | null }> {
  assertConfig();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Supabase catalog error: HTTP ${response.status}`);
  }

  let data: T | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = null;
    }
  }
  return { response, data };
}

function titleOf(item: TmdbTitle) {
  return item.title || item.name || item.original_title || item.original_name || 'Untitled';
}

function isAnimeTitle(item: TmdbTitle) {
  const isJapanese = item.original_language === 'ja';
  const isAnimation = Boolean(
    item.genres?.some(g => g.id === 16) ||
    item.genre_ids?.includes(16),
  );
  return isJapanese && isAnimation;
}

function mapCandidate(item: TmdbTitle, mediaType: TmdbMediaType, source: string) {
  const now = new Date().toISOString();
  const title = titleOf(item);
  return {
    tmdb_id: item.id,
    media_type: mediaType,
    slug: `${slugify(title)}-${item.id}`,
    title,
    original_title: item.original_title || item.original_name || null,
    overview: item.overview || null,
    tagline: item.tagline || null,
    original_language: item.original_language || null,
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    release_date: item.release_date || null,
    first_air_date: item.first_air_date || null,
    runtime: item.runtime ?? null,
    number_of_seasons: item.number_of_seasons ?? null,
    number_of_episodes: item.number_of_episodes ?? null,
    vote_average: item.vote_average ?? null,
    vote_count: item.vote_count ?? null,
    popularity: item.popularity ?? null,
    status: item.status || null,
    homepage: item.homepage || null,
    adult: Boolean(item.adult),
    last_discovered_at: now,
    discovery_source: source,
    is_anime: isAnimeTitle(item),
  };
}

export async function upsertDiscoveredTitles(
  items: TmdbTitle[],
  mediaType: TmdbMediaType,
  source: string,
) {
  if (!items.length) return 0;

  const payload = items
    .filter(item => Number.isInteger(item.id) && item.id > 0 && !item.adult)
    .map(item => mapCandidate(item, mediaType, source));

  if (!payload.length) return 0;

  const query = new URLSearchParams({ on_conflict: 'tmdb_id,media_type' });

  await supabaseRequest(`titles?${query.toString()}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(payload),
  });

  return payload.length;
}

function catalogSelect() {
  return 'id,tmdb_id,media_type,slug,title,overview,poster_path,raw,indexable,quality_state,quality_score,quality_attempts,quality_next_attempt_at,content_hash,last_synced_at';
}

export async function getCatalogTitle(mediaType: TmdbMediaType, tmdbId: number) {
  const params = new URLSearchParams({
    select: catalogSelect(),
    tmdb_id: `eq.${tmdbId}`,
    media_type: `eq.${mediaType}`,
    limit: '1',
  });

  const { data } = await supabaseRequest<CatalogRow[]>(`titles?${params.toString()}`);
  return data?.[0] || null;
}

export async function getPendingCatalogTitles(limit: number) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const select = catalogSelect();

  const pending = new URLSearchParams({
    select,
    quality_state: 'eq.pending',
    order: 'popularity.desc.nullslast,updated_at.asc',
    limit: String(safeLimit),
  });
  const pendingResult = await supabaseRequest<CatalogRow[]>(`titles?${pending.toString()}`);
  const pendingRows = pendingResult.data || [];

  const remainingAfterPending = Math.max(0, safeLimit - pendingRows.length);
  if (!remainingAfterPending) return pendingRows;

  const now = new Date().toISOString();
  const retry = new URLSearchParams({
    select,
    quality_state: 'eq.error',
    quality_attempts: 'lt.5',
    quality_next_attempt_at: `lte.${now}`,
    order: 'quality_attempts.asc,popularity.desc.nullslast,updated_at.asc',
    limit: String(remainingAfterPending),
  });
  const retryResult = await supabaseRequest<CatalogRow[]>(`titles?${retry.toString()}`);
  const retryRows = retryResult.data || [];

  const remainingAfterRetry = Math.max(0, remainingAfterPending - retryRows.length);
  if (!remainingAfterRetry) return [...pendingRows, ...retryRows];

  const staleBefore = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  const stale = new URLSearchParams({
    select,
    quality_state: 'eq.ready',
    last_synced_at: `lt.${staleBefore}`,
    order: 'popularity.desc.nullslast,last_synced_at.asc',
    limit: String(remainingAfterRetry),
  });
  const staleResult = await supabaseRequest<CatalogRow[]>(`titles?${stale.toString()}`);

  return [...pendingRows, ...retryRows, ...(staleResult.data || [])];
}

export async function updateCatalogAfterEnrichment(
  row: CatalogRow,
  detail: TmdbTitle,
) {
  const now = new Date().toISOString();
  const quality = evaluateQualityGate({
    title: titleOf(detail),
    overview: detail.overview,
    posterPath: detail.poster_path,
    genres: detail.genres,
    castCount: detail.credits?.cast?.length,
    trailerAvailable: detail.videos?.results?.some(
      video => video.site === 'YouTube' && video.type === 'Trailer',
    ),
    recommendationCount: detail.recommendations?.results?.filter(item => item.poster_path).length,
  });

  const contentHash = createHash('sha256').update(JSON.stringify(detail)).digest('hex');
  const contentChanged = row.content_hash !== contentHash;

  const patch = {
    slug: `${slugify(titleOf(detail))}-${detail.id}`,
    title: titleOf(detail),
    original_title: detail.original_title || detail.original_name || null,
    overview: detail.overview || null,
    tagline: detail.tagline || null,
    original_language: detail.original_language || null,
    poster_path: detail.poster_path || null,
    backdrop_path: detail.backdrop_path || null,
    release_date: detail.release_date || null,
    first_air_date: detail.first_air_date || null,
    runtime: detail.runtime ?? null,
    number_of_seasons: detail.number_of_seasons ?? null,
    number_of_episodes: detail.number_of_episodes ?? null,
    vote_average: detail.vote_average ?? null,
    vote_count: detail.vote_count ?? null,
    popularity: detail.popularity ?? null,
    status: detail.status || null,
    homepage: detail.homepage || null,
    adult: Boolean(detail.adult),
    raw: detail,
    indexable: !detail.adult && quality.indexable,
    quality_score: quality.score,
    quality_state: 'ready',
    quality_checked_at: now,
    quality_error: null,
    content_hash: contentHash,
    quality_attempts: 0,
    quality_next_attempt_at: null,
    last_synced_at: now,
    updated_at: now,
    ...(contentChanged || !row.raw ? { last_content_change_at: now } : {}),
    is_anime: isAnimeTitle(detail),
  };

  const { response, data } = await supabaseRequest(
    `titles?id=eq.${encodeURIComponent(row.id)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    },
  );

  return {
    quality,
    changed: contentChanged || !row.raw,
    row: Array.isArray(data) ? data[0] : null,
    response,
  };
}

export async function markCatalogEnrichmentError(row: CatalogRow, error: unknown) {
  const previousAttempts = Number(row.quality_attempts || 0);
  const attempts = previousAttempts + 1;
  const message = error instanceof Error ? error.message : String(error);
  const statusMatch = message.match(/HTTP (\d{3})/);
  const status = statusMatch ? Number(statusMatch[1]) : 0;

  if (status === 404) {
    await supabaseRequest(`titles?id=eq.${encodeURIComponent(row.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        indexable: false,
        quality_state: 'removed',
        quality_error: 'TMDB title not found',
        quality_checked_at: new Date().toISOString(),
        quality_next_attempt_at: null,
      }),
    });
    return { state: 'removed' as const };
  }

  const delayMinutes = status === 429
    ? 30
    : Math.min(360, 15 * 2 ** Math.min(attempts - 1, 4));
  const nextAttempt = new Date(Date.now() + delayMinutes * 60_000).toISOString();

  await supabaseRequest(`titles?id=eq.${encodeURIComponent(row.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      indexable: false,
      quality_state: 'error',
      quality_error: message.slice(0, 500),
      quality_checked_at: new Date().toISOString(),
      quality_attempts: attempts,
      quality_next_attempt_at: nextAttempt,
    }),
  });

  return { state: 'error' as const };
}

function categoryFilters(category: CatalogCategory) {
  if (category === 'movies') return { mediaType: 'movie' as const, anime: false };
  if (category === 'series') return { mediaType: 'tv' as const, anime: false };
  return { anime: true };
}

export async function countCatalogSitemap(category: CatalogCategory) {
  const filters = categoryFilters(category);
  const params = new URLSearchParams({
    select: 'id',
    indexable: 'eq.true',
    quality_state: 'eq.ready',
    limit: '1',
    offset: '0',
  });

  if (filters.mediaType) params.set('media_type', `eq.${filters.mediaType}`);
  params.set('is_anime', `eq.${filters.anime}`);

  const { response } = await supabaseRequest(`titles?${params.toString()}`, {
    headers: { Prefer: 'count=exact' },
  });

  return parseContentRange(response.headers.get('content-range'));
}

export async function getCatalogSitemapRows(category: CatalogCategory, part: number) {
  const filters = categoryFilters(category);
  const offset = part * SITEMAP_PAGE_SIZE;
  const params = new URLSearchParams({
    select: 'slug,tmdb_id,media_type,last_content_change_at,updated_at',
    indexable: 'eq.true',
    quality_state: 'eq.ready',
    order: 'id.asc',
    offset: String(offset),
    limit: String(SITEMAP_PAGE_SIZE),
  });

  if (filters.mediaType) params.set('media_type', `eq.${filters.mediaType}`);
  params.set('is_anime', `eq.${filters.anime}`);

  const { data } = await supabaseRequest<Array<{
    slug: string;
    tmdb_id: number;
    media_type: TmdbMediaType;
    last_content_change_at: string | null;
    updated_at: string;
  }>>(`titles?${params.toString()}`);

  return data || [];
}

function parseContentRange(value: string | null) {
  if (!value) return 0;
  const match = value.match(/(?:\d+-\d+|\*)\/(\d+|\*)/);
  return match?.[1] && match[1] !== '*' ? Number(match[1]) : 0;
}

export async function getSyncShards(limit: number) {
  const params = new URLSearchParams({
    select: 'id,shard_key,media_type,shard_kind,filters,next_page,completed,priority,pages_fetched,items_seen,last_run_at,last_error,locked_until',
    completed: 'eq.false',
    order: 'priority.desc,last_run_at.asc.nullslast,next_page.asc',
    limit: String(Math.max(1, Math.min(limit, 100))),
  });

  const { data } = await supabaseRequest<Array<{
    id: string;
    shard_key: string;
    media_type: TmdbMediaType;
    shard_kind: string;
    filters: TmdbDiscoverOptions;
    next_page: number;
    completed: boolean;
    priority: number;
    pages_fetched: number;
    items_seen: number;
    last_run_at: string | null;
    last_error: string | null;
    locked_until: string | null;
  }>>(`catalog_sync_shards?${params.toString()}`);

  return (data || []).filter(
    row => !row.locked_until || new Date(row.locked_until).getTime() < Date.now(),
  );
}

export async function lockSyncShard(id: string) {
  const lockedUntil = new Date(Date.now() + 5 * 60_000).toISOString();
  await supabaseRequest(`catalog_sync_shards?id=eq.${encodeURIComponent(id)}&completed=eq.false`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ locked_until: lockedUntil }),
  });
  return lockedUntil;
}

export async function updateSyncShard(id: string, patch: Record<string, unknown>) {
  await supabaseRequest(`catalog_sync_shards?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
}

export async function createSyncShards(
  rows: Array<{
    shard_key: string;
    media_type: TmdbMediaType;
    shard_kind: 'year' | 'language_year' | 'genre_language_year' | 'anime_year';
    filters: TmdbDiscoverOptions;
    priority?: number;
  }>,
) {
  if (!rows.length) return 0;

  await supabaseRequest('catalog_sync_shards', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });

  return rows.length;
}

export async function startSyncRun(source: string, requestedCount = 0) {
  const { data } = await supabaseRequest<Array<{ id: string }>>('sync_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      source,
      status: 'running',
      requested_count: requestedCount,
    }),
  });

  return data?.[0]?.id || null;
}

export async function finishSyncRun(
  id: string | null,
  patch: Record<string, unknown>,
) {
  if (!id) return;

  await supabaseRequest(`sync_runs?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      ...patch,
      finished_at: new Date().toISOString(),
    }),
  });
}
