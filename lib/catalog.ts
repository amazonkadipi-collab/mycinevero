import { slugify, tmdbImage, type TmdbTitle } from '@/lib/tmdb';

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_KEY = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export type CatalogTitle = {
  id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  slug: string;
  title: string;
  original_title?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  runtime?: number | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  vote_average?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
  status?: string | null;
  adult?: boolean;
  last_synced_at?: string | null;
  updated_at?: string | null;
  raw?: TmdbTitle | null;
};

export function posterUrl(title: CatalogTitle | TmdbTitle, size: 'w342' | 'w500' = 'w342') { return tmdbImage(title.poster_path, size); }
export function backdropUrl(title: CatalogTitle | TmdbTitle, size: 'w780' | 'original' = 'w780') { return tmdbImage(title.backdrop_path, size); }
function headers() { if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase server environment is not configured'); return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }; }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, cache: 'no-store', headers: { ...headers(), ...(init.headers || {}) } }); if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`); return response.json() as Promise<T>; }
export async function getCatalogTitle(type: 'movie' | 'tv', slug: string) { const rows = await request<CatalogTitle[]>(`titles?select=*&media_type=eq.${type}&slug=eq.${encodeURIComponent(slug)}&limit=1`); return rows[0] || null; }
export async function searchCatalog(query: string, limit = 40) { const safe = query.replace(/[%_]/g, '').trim().slice(0, 100); if (!safe) return []; const encoded = encodeURIComponent(`*${safe}*`); return request<CatalogTitle[]>(`titles?select=*&or=(title.ilike.${encoded},original_title.ilike.${encoded})&order=popularity.desc&limit=${limit}`); }
export async function latestCatalog(limit = 24) { return request<CatalogTitle[]>(`titles?select=*&order=last_synced_at.desc&limit=${limit}`); }
export async function popularCatalog(limit = 24) { return request<CatalogTitle[]>(`titles?select=*&order=popularity.desc&limit=${limit}`); }
export async function catalogByType(type: 'movie' | 'tv', limit = 24) { return request<CatalogTitle[]>(`titles?select=*&media_type=eq.${type}&order=popularity.desc&limit=${limit}`); }
export async function upsertTmdbTitle(item: TmdbTitle, mediaType: 'movie' | 'tv') {
  const name = item.title || item.name || item.original_title || item.original_name || 'Untitled';
  const date = mediaType === 'movie' ? item.release_date || null : item.first_air_date || null;
  const slug = `${slugify(name)}-${item.id}`;
  const payload = { tmdb_id: item.id, media_type: mediaType, slug, title: name, original_title: item.original_title || item.original_name || null, overview: item.overview || null, tagline: item.tagline || null, original_language: item.original_language || null, poster_path: item.poster_path || null, backdrop_path: item.backdrop_path || null, release_date: mediaType === 'movie' ? date : null, first_air_date: mediaType === 'tv' ? date : null, runtime: item.runtime || null, number_of_seasons: item.number_of_seasons || null, number_of_episodes: item.number_of_episodes || null, vote_average: item.vote_average || 0, vote_count: item.vote_count || 0, popularity: item.popularity || 0, status: item.status || null, homepage: item.homepage || null, adult: Boolean(item.adult), raw: item, last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const rows = await request<CatalogTitle[]>('titles?on_conflict=tmdb_id,media_type', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(payload) });
  return rows[0];
}
