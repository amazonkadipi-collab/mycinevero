import type { MetadataRoute } from 'next';
import { slugify, tmdbNowPlaying, tmdbPopular, tmdbTrending, tmdbUpcoming, type TmdbMediaType, type TmdbTitle } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
export const dynamic = 'force-static';
export const revalidate = 3600;

const GENRES = ['action','adventure','animation','comedy','crime','documentary','drama','family','fantasy','horror','mystery','romance','science-fiction','thriller','western'];
const GUIDES = ['how-to-choose-a-movie-by-mood','what-to-watch-when-you-have-90-minutes','movie-or-tv-series','how-cinevero-recommendations-work','how-to-find-a-good-movie-without-scrolling-forever'];
const TRUST_ROUTES = ['about','guides','faq','privacy-policy','terms','dmca','contact'];
const MAX_CATALOG_URLS_PER_TYPE = 100;

type TmdbList = { results: TmdbTitle[] };
function titleOf(item: TmdbTitle, type: TmdbMediaType) { return type === 'tv' ? item.name || item.original_name || 'series' : item.title || item.original_title || 'movie'; }
function urlFor(item: TmdbTitle, type: TmdbMediaType) { return `${SITE_URL}/${type === 'tv' ? 'series' : 'movie'}/${slugify(titleOf(item, type))}-${item.id}`; }
async function safe<T>(request: Promise<T>, fallback: T): Promise<T> { try { return await request; } catch { return fallback; } }
function catalogEntries(items: TmdbTitle[], type: TmdbMediaType) {
  const unique = Array.from(new Map(items.filter(item => Number.isInteger(item.id)).map(item => [item.id, item])).values()).slice(0, MAX_CATALOG_URLS_PER_TYPE);
  return unique.map(item => ({ url: urlFor(item, type), changeFrequency: 'weekly' as const, priority: 0.7 }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const empty: TmdbList = { results: [] };
  const [trending, popularMovies, popularSeries, nowPlaying, upcoming] = await Promise.all([
    safe(tmdbTrending('all','week'), empty),
    safe(tmdbPopular('movie'), empty),
    safe(tmdbPopular('tv'), empty),
    safe(tmdbNowPlaying(), empty),
    safe(tmdbUpcoming(), empty),
  ]);
  const movies = [...popularMovies.results, ...nowPlaying.results, ...upcoming.results, ...trending.results.filter(x => x.media_type === 'movie')];
  const series = [...popularSeries.results, ...trending.results.filter(x => x.media_type === 'tv')];
  const movieEntries = catalogEntries(movies, 'movie');
  const seriesEntries = catalogEntries(series, 'tv');
  const unique = new Map([...movieEntries, ...seriesEntries].map(entry => [entry.url, entry]));

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/discover`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/genres`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/guides`, changeFrequency: 'weekly', priority: 0.9 },
    ...GUIDES.map(slug => ({ url: `${SITE_URL}/guides/${slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${SITE_URL}/movie`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/series`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/anime`, changeFrequency: 'daily', priority: 0.85 },
    ...GENRES.map(slug => ({ url: `${SITE_URL}/genre/${slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...TRUST_ROUTES.map(slug => ({ url: `${SITE_URL}/${slug}`, changeFrequency: 'monthly' as const, priority: 0.4 })),
    ...Array.from(unique.values()),
  ];
}
