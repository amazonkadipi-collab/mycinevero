import { cache } from 'react';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export type TmdbMediaType = 'movie' | 'tv';
export type TmdbTitle = {
  id: number;
  media_type?: TmdbMediaType;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  tagline?: string;
  original_language?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  status?: string;
  homepage?: string | null;
  adult?: boolean;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  credits?: { cast?: { id: number; name: string; character?: string; profile_path?: string | null; order?: number }[]; crew?: { id: number; name: string; department?: string; job?: string; profile_path?: string | null }[] };
  recommendations?: { results: TmdbTitle[] };
  videos?: { results: { id: string; key: string; name: string; site: string; type: string; official?: boolean; published_at?: string }[] };
  watch_providers?: { results?: Record<string, { link?: string; flatrate?: { provider_id: number; provider_name: string; logo_path?: string }[]; rent?: { provider_id: number; provider_name: string; logo_path?: string }[]; buy?: { provider_id: number; provider_name: string; logo_path?: string }[]; free?: { provider_id: number; provider_name: string; logo_path?: string }[]; ads?: { provider_id: number; provider_name: string; logo_path?: string }[] }> };
  seasons?: TmdbSeason[];
  external_ids?: { imdb_id?: string | null; tvdb_id?: number | null; wikidata_id?: string | null };
};

export type TmdbSeason = { id: number; season_number: number; name?: string; overview?: string; air_date?: string | null; episode_count?: number; poster_path?: string | null; episodes?: TmdbEpisode[] };
export type TmdbEpisode = { id: number; episode_number: number; name: string; overview?: string; air_date?: string | null; runtime?: number | null; vote_average?: number; still_path?: string | null };

function token() {
  const value = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  if (!value) throw new Error('TMDB_READ_ACCESS_TOKEN is not configured');
  return value;
}

export function tmdbImage(path: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
}

export function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'title';
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  revalidate = 3600,
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) throw new Error(`TMDB returned HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

async function tmdbTwoPages(path: string, params: Record<string, string | number | undefined> = {}) {
  const [first, second] = await Promise.all([
    tmdbFetch<{ results: TmdbTitle[]; total_pages: number }>(path, { ...params, page: 1 }),
    tmdbFetch<{ results: TmdbTitle[]; total_pages: number }>(path, { ...params, page: 2 }),
  ]);

  const seen = new Set<number>();
  const results = [...first.results, ...second.results].filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return { results, total_pages: first.total_pages };
}

export async function tmdbTrending(type: TmdbMediaType | 'all' = 'all', window: 'day' | 'week' = 'week') {
  return tmdbTwoPages(`/trending/${type}/${window}`, { language: 'en-US' });
}

export async function tmdbPopular(type: TmdbMediaType) {
  return tmdbTwoPages(`/${type}/popular`, { language: 'en-US' });
}

export async function tmdbNowPlaying() {
  return tmdbTwoPages('/movie/now_playing', { language: 'en-US' });
}

export async function tmdbUpcoming() {
  return tmdbTwoPages('/movie/upcoming', { language: 'en-US' });
}

export type TmdbDiscoverOptions = {
  genreId?: number | string;
  runtimeMax?: number;
  voteAverageMin?: number;
  sortBy?: string;
  year?: number;
  originalLanguage?: string;
  withGenres?: number | string;
};

export async function tmdbDiscoverPage(
  type: TmdbMediaType,
  page = 1,
  options: TmdbDiscoverOptions = {},
) {
  return tmdbFetch<{ results: TmdbTitle[]; total_pages: number; total_results: number }>(
    `/discover/${type}`,
    {
      language: 'en-US',
      include_adult: 'false',
      include_video: 'false',
      sort_by: options.sortBy || 'popularity.desc',
      page,
      with_genres: options.withGenres ?? options.genreId,
      with_runtime_lte: type === 'movie' ? options.runtimeMax : undefined,
      vote_average_gte: options.voteAverageMin,
      primary_release_year: type === 'movie' ? options.year : undefined,
      first_air_date_year: type === 'tv' ? options.year : undefined,
      with_original_language: options.originalLanguage,
    },
  );
}

export async function tmdbAnime(type: TmdbMediaType = 'tv', page = 1) {
  return tmdbDiscoverPage(type, page, {
    withGenres: 16,
    originalLanguage: 'ja',
  });
}

export async function tmdbAnimeHome() {
  const [tv, movie] = await Promise.all([tmdbAnime('tv', 1), tmdbAnime('movie', 1)]);
  return {
    results: [
      ...tv.results.map(x => ({ ...x, media_type: 'tv' as const })),
      ...movie.results.map(x => ({ ...x, media_type: 'movie' as const })),
    ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 12),
  };
}

export async function tmdbSearch(query: string, page = 1) {
  return tmdbFetch<{ results: TmdbTitle[]; total_pages: number; total_results: number }>(
    '/search/multi',
    { query, include_adult: 'false', language: 'en-US', page },
  );
}

export const tmdbDetails = cache(async function tmdbDetails(type: TmdbMediaType, id: number) {
  return tmdbFetch<TmdbTitle>(
    `/${type}/${id}`,
    {
      language: 'en-US',
      append_to_response: 'credits,external_ids,videos,recommendations,watch/providers',
    },
    86400,
  );
});

export async function tmdbGenres(type: TmdbMediaType) {
  return tmdbFetch<{ genres: { id: number; name: string }[] }>(
    `/genre/${type}/list`,
    { language: 'en-US' },
    86400,
  );
}

export async function tmdbDiscover(
  type: TmdbMediaType,
  page = 1,
  options: TmdbDiscoverOptions | number = {},
) {
  const filters = typeof options === 'number' ? { genreId: options } : { ...options };
  return tmdbDiscoverPage(type, page, filters);
}

export async function tmdbSeason(seriesId: number, seasonNumber: number) {
  return tmdbFetch<TmdbSeason>(
    `/tv/${seriesId}/season/${seasonNumber}`,
    { language: 'en-US' },
    21600,
  );
}
