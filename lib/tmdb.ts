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
  seasons?: TmdbSeason[];
  external_ids?: { imdb_id?: string | null; tvdb_id?: number | null; wikidata_id?: string | null };
};
export type TmdbSeason = { id: number; season_number: number; name?: string; overview?: string; air_date?: string | null; episode_count?: number; poster_path?: string | null; episodes?: TmdbEpisode[] };
export type TmdbEpisode = { id: number; episode_number: number; name: string; overview?: string; air_date?: string | null; runtime?: number | null; vote_average?: number; still_path?: string | null };

function token() { const value = process.env.TMDB_READ_ACCESS_TOKEN?.trim(); if (!value) throw new Error('TMDB_READ_ACCESS_TOKEN is not configured'); return value; }
export function tmdbImage(path: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') { return path ? `https://image.tmdb.org/t/p/${size}${path}` : ''; }
export function slugify(value: string) { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'title'; }
async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined> = {}, revalidate = 3600): Promise<T> { const url = new URL(`${TMDB_BASE_URL}${path}`); for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value)); const response = await fetch(url, { next: { revalidate }, headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json' } }); if (!response.ok) throw new Error(`TMDB returned HTTP ${response.status}`); return response.json() as Promise<T>; }
export async function tmdbTrending(type: TmdbMediaType | 'all' = 'all', window: 'day' | 'week' = 'week') { return tmdbFetch<{ results: TmdbTitle[] }>(`/trending/${type}/${window}`, { language: 'en-US' }); }
export async function tmdbPopular(type: TmdbMediaType) { return tmdbFetch<{ results: TmdbTitle[] }>(`/${type}/popular`, { language: 'en-US', page: 1 }); }
export async function tmdbNowPlaying() { return tmdbFetch<{ results: TmdbTitle[] }>('/movie/now_playing', { language: 'en-US', page: 1 }); }
export async function tmdbUpcoming() { return tmdbFetch<{ results: TmdbTitle[] }>('/movie/upcoming', { language: 'en-US', page: 1 }); }
export async function tmdbSearch(query: string, page = 1) { return tmdbFetch<{ results: TmdbTitle[]; total_pages: number; total_results: number }>('/search/multi', { query, include_adult: 'false', language: 'en-US', page }); }
export async function tmdbDetails(type: TmdbMediaType, id: number) { return tmdbFetch<TmdbTitle>(`/${type}/${id}`, { language: 'en-US', append_to_response: 'credits,external_ids,videos,recommendations' }, 21600); }
export async function tmdbGenres(type: TmdbMediaType) { return tmdbFetch<{ genres: { id: number; name: string }[] }>(`/genre/${type}/list`, { language: 'en-US' }, 86400); }
export async function tmdbDiscover(type: TmdbMediaType, page = 1, genreId?: number) { return tmdbFetch<{ results: TmdbTitle[]; total_pages: number }>(`/discover/${type}`, { language: 'en-US', include_adult: 'false', include_video: 'false', sort_by: 'popularity.desc', page, with_genres: genreId }); }
export async function tmdbSeason(seriesId: number, seasonNumber: number) { return tmdbFetch<TmdbSeason>(`/tv/${seriesId}/season/${seasonNumber}`, { language: 'en-US' }, 21600); }
