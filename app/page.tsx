import type { Metadata } from 'next';
import CatalogHome from '@/components/CatalogHome';
import { tmdbNowPlaying, tmdbPopular, tmdbTrending, tmdbUpcoming } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://watchmovies4.vercel.app';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Cinevero – Movies & TV Series Discovery',
  description: 'Discover trending movies, popular TV series, genres, ratings and official trailers with Cinevero.',
  alternates: { canonical: SITE_URL },
  openGraph: { title: 'Cinevero – Movies & TV Series Discovery', description: 'Discover movies and TV series, explore genres, ratings, trailers and related titles.', url: SITE_URL, type: 'website', siteName: 'Cinevero' },
};
const empty = { results: [] };
export default async function HomePage() {
  const [trending, popularMovies, popularSeries, latestMovies, upcoming] = await Promise.all([
    tmdbTrending('all', 'week').catch(() => empty), tmdbPopular('movie').catch(() => empty), tmdbPopular('tv').catch(() => empty), tmdbNowPlaying().catch(() => empty), tmdbUpcoming().catch(() => empty),
  ]);
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Cinevero', url: SITE_URL, description: 'Movies and TV series discovery catalogue.', potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }) }} /><CatalogHome trending={trending.results} popularMovies={popularMovies.results} popularSeries={popularSeries.results.map((x) => ({ ...x, media_type: 'tv' as const }))} latestMovies={latestMovies.results.map((x) => ({ ...x, media_type: 'movie' as const }))} upcoming={upcoming.results.map((x) => ({ ...x, media_type: 'movie' as const }))} /></>;
}
