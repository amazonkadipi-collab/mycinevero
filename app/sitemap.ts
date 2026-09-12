import type { MetadataRoute } from 'next';
import { slugify, tmdbDiscover, tmdbNowPlaying, tmdbPopular, tmdbTrending, tmdbUpcoming, type TmdbMediaType, type TmdbTitle } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
export const revalidate = 3600;

const GENRES = ['action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama', 'family', 'fantasy', 'horror', 'mystery', 'romance', 'science-fiction', 'thriller', 'western'];
const DISCOVER_PAGES = 10;

function titleOf(item: TmdbTitle, type: TmdbMediaType) {
  return type === 'tv' ? item.name || item.original_name || 'series' : item.title || item.original_title || 'movie';
}

function urlFor(item: TmdbTitle, type: TmdbMediaType) {
  return `${SITE_URL}/${type === 'tv' ? 'series' : 'movie'}/${slugify(titleOf(item, type))}-${item.id}`;
}

function entriesFor(items: TmdbTitle[], type: TmdbMediaType) {
  return items.filter((item) => Number.isInteger(item.id)).map((item) => ({ url: urlFor(item, type), changeFrequency: 'weekly' as const, priority: 0.7 }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trending, popularMovies, popularSeries, nowPlaying, upcoming, ...discoverPages] = await Promise.all([
    tmdbTrending('all', 'week').catch(() => ({ results: [] as TmdbTitle[] })),
    tmdbPopular('movie').catch(() => ({ results: [] as TmdbTitle[] })),
    tmdbPopular('tv').catch(() => ({ results: [] as TmdbTitle[] })),
    tmdbNowPlaying().catch(() => ({ results: [] as TmdbTitle[] })),
    tmdbUpcoming().catch(() => ({ results: [] as TmdbTitle[] })),
    ...Array.from({ length: DISCOVER_PAGES }, (_, index) => Promise.all([
      tmdbDiscover('movie', index + 1).catch(() => ({ results: [] as TmdbTitle[] })),
      tmdbDiscover('tv', index + 1).catch(() => ({ results: [] as TmdbTitle[] })),
    ])),
  ]);

  const discoverMovies = discoverPages.flatMap((pair) => pair[0].results);
  const discoverSeries = discoverPages.flatMap((pair) => pair[1].results);
  const trendingMovies = trending.results.filter((item) => item.media_type === 'movie');
  const trendingSeries = trending.results.filter((item) => item.media_type === 'tv');
  const detailEntries = [
    ...entriesFor([...popularMovies.results, ...nowPlaying.results, ...upcoming.results, ...discoverMovies, ...trendingMovies], 'movie'),
    ...entriesFor([...popularSeries.results, ...discoverSeries, ...trendingSeries], 'tv'),
  ];
  const unique = new Map(detailEntries.map((entry) => [entry.url, entry]));

  return [
    { url: SITE_URL, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${SITE_URL}/movie`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${SITE_URL}/series`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${SITE_URL}/genres`, changeFrequency: 'weekly' as const, priority: 0.7 },
    ...GENRES.map((slug) => ({ url: `${SITE_URL}/genre/${slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...Array.from(unique.values()),
  ];
}
