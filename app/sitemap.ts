import type { MetadataRoute } from 'next';
import { slugify, tmdbNowPlaying, tmdbPopular, tmdbTrending, tmdbUpcoming, type TmdbMediaType, type TmdbTitle } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://watchmovies4.vercel.app';
export const revalidate = 3600;

function titleOf(item: TmdbTitle, type: TmdbMediaType) {
  return type === 'tv' ? item.name || item.original_name || 'series' : item.title || item.original_title || 'movie';
}

function urlFor(item: TmdbTitle, type: TmdbMediaType) {
  return `${SITE_URL}/${type === 'tv' ? 'series' : 'movie'}/${slugify(titleOf(item, type))}-${item.id}`;
}

function entriesFor(items: TmdbTitle[], type: TmdbMediaType) {
  return items
    .filter((item) => Number.isInteger(item.id))
    .map((item) => ({
      url: urlFor(item, type),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trending, popularMovies, popularSeries, nowPlaying, upcoming] = await Promise.all([
    tmdbTrending('all', 'week').catch(() => ({ results: [] as TmdbTitle[] })),
    tmdbPopular('movie').catch(() => ({ results: [] as TmdbTitle[] })),
    tmdbPopular('tv').catch(() => ({ results: [] as TmdbTitle[] })),
    tmdbNowPlaying().catch(() => ({ results: [] as TmdbTitle[] })),
    tmdbUpcoming().catch(() => ({ results: [] as TmdbTitle[] })),
  ]);

  const movies = [...popularMovies.results, ...nowPlaying.results, ...upcoming.results];
  const series = [...popularSeries.results];
  const trendingMovies = trending.results.filter((item) => item.media_type === 'movie');
  const trendingSeries = trending.results.filter((item) => item.media_type === 'tv');

  const detailEntries = [
    ...entriesFor([...movies, ...trendingMovies], 'movie'),
    ...entriesFor([...series, ...trendingSeries], 'tv'),
  ];

  const unique = new Map(detailEntries.map((entry) => [entry.url, entry]));

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/movie`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/series`, changeFrequency: 'daily', priority: 0.8 },
    ...unique.values(),
  ];
}
