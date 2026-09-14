import type { MetadataRoute } from 'next';
import { evaluateQualityGate } from '@/lib/quality-gate';
import { slugify, tmdbDetails, tmdbDiscover, tmdbNowPlaying, tmdbPopular, tmdbTrending, tmdbUpcoming, type TmdbMediaType, type TmdbTitle } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
export const dynamic = 'force-static';
export const revalidate = 3600;

const GENRES = ['action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama', 'family', 'fantasy', 'horror', 'mystery', 'romance', 'science-fiction', 'thriller', 'western'];
const GUIDES = ['how-to-choose-a-movie-by-mood', 'what-to-watch-when-you-have-90-minutes', 'movie-or-tv-series', 'how-cinevero-recommendations-work', 'how-to-find-a-good-movie-without-scrolling-forever'];
const DISCOVER_PAGES = 5;
const MAX_DETAIL_CANDIDATES = 120;
const DETAIL_CONCURRENCY = 8;
type TmdbList = { results: TmdbTitle[] };
type DiscoverList = { results: TmdbTitle[]; total_pages: number };
function titleOf(item: TmdbTitle, type: TmdbMediaType) { return type === 'tv' ? item.name || item.original_name || 'series' : item.title || item.original_title || 'movie'; }
function urlFor(item: TmdbTitle, type: TmdbMediaType) { return `${SITE_URL}/${type === 'tv' ? 'series' : 'movie'}/${slugify(titleOf(item, type))}-${item.id}`; }
function isIndexableDetail(item: TmdbTitle, type: TmdbMediaType) {
  const result = evaluateQualityGate({
    title: titleOf(item, type), overview: item.overview, posterPath: item.poster_path,
    genres: item.genres, castCount: item.credits?.cast?.length,
    seasonCount: item.number_of_seasons ?? item.seasons?.length,
    episodeCount: item.number_of_episodes ?? item.seasons?.reduce((sum, season) => sum + Number(season.episode_count || 0), 0),
    trailerAvailable: Boolean(item.videos?.results?.some((video) => video.site === 'YouTube' && video.key)),
    recommendationCount: item.recommendations?.results?.length,
  });
  return result.indexable;
}
async function safe<T>(request: Promise<T>, fallback: T): Promise<T> { try { return await request; } catch { return fallback; } }
async function filterIndexableDetails(items: TmdbTitle[], type: TmdbMediaType) {
  const unique = Array.from(new Map(items.filter((item) => Number.isInteger(item.id)).map((item) => [item.id, item])).values()).slice(0, MAX_DETAIL_CANDIDATES);
  const approved: TmdbTitle[] = [];
  for (let start = 0; start < unique.length; start += DETAIL_CONCURRENCY) {
    const batch = unique.slice(start, start + DETAIL_CONCURRENCY);
    const results = await Promise.all(batch.map((item) => safe(tmdbDetails(type, item.id), null)));
    results.forEach((detail) => { if (detail && isIndexableDetail(detail, type)) approved.push(detail); });
  }
  return approved.map((item) => ({ url: urlFor(item, type), changeFrequency: 'weekly' as const, priority: 0.7 }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const emptyList: TmdbList = { results: [] }; const emptyDiscover: DiscoverList = { results: [], total_pages: 0 };
  const [trending, popularMovies, popularSeries, nowPlaying, upcoming, ...discoverPages] = await Promise.all([
    safe(tmdbTrending('all', 'week'), emptyList), safe(tmdbPopular('movie'), emptyList), safe(tmdbPopular('tv'), emptyList), safe(tmdbNowPlaying(), emptyList), safe(tmdbUpcoming(), emptyList),
    ...Array.from({ length: DISCOVER_PAGES }, (_, index) => Promise.all([safe(tmdbDiscover('movie', index + 1), emptyDiscover), safe(tmdbDiscover('tv', index + 1), emptyDiscover)])),
  ]);
  const discoverMovies = discoverPages.flatMap((pair) => pair[0].results); const discoverSeries = discoverPages.flatMap((pair) => pair[1].results);
  const trendingMovies = trending.results.filter((item) => item.media_type === 'movie'); const trendingSeries = trending.results.filter((item) => item.media_type === 'tv');
  const movieCandidates = [...popularMovies.results, ...nowPlaying.results, ...upcoming.results, ...discoverMovies, ...trendingMovies];
  const seriesCandidates = [...popularSeries.results, ...discoverSeries, ...trendingSeries];
  const [movieEntries, seriesEntries] = await Promise.all([filterIndexableDetails(movieCandidates, 'movie'), filterIndexableDetails(seriesCandidates, 'tv')]);
  const unique = new Map([...movieEntries, ...seriesEntries].map((entry) => [entry.url, entry]));
  return [
    { url: SITE_URL, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${SITE_URL}/discover`, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${SITE_URL}/genres`, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${SITE_URL}/guides`, changeFrequency: 'weekly' as const, priority: 0.9 },
    ...GUIDES.map((slug) => ({ url: `${SITE_URL}/guides/${slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${SITE_URL}/movie`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${SITE_URL}/series`, changeFrequency: 'daily' as const, priority: 0.8 },
    ...GENRES.map((slug) => ({ url: `${SITE_URL}/genre/${slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...Array.from(unique.values()),
  ];
}
