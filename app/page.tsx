import type { Metadata } from 'next';
import CatalogHome from '@/components/CatalogHome';
import { tmdbNowPlaying, tmdbPopular, tmdbTrending, tmdbUpcoming } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://watchmovies4.vercel.app';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Watch Movies 4 – Movies & Series', description: 'Discover trending movies, popular series, new releases and upcoming films.', alternates: { canonical: SITE_URL }, openGraph: { title: 'Watch Movies 4 – Movies & Series', description: 'Discover movies and TV series in one clean catalogue.', url: SITE_URL, type: 'website' } };
const empty = { results: [] };
export default async function HomePage() {
  const [trending, popularMovies, popularSeries, latestMovies, upcoming] = await Promise.all([
    tmdbTrending('all', 'week').catch(() => empty), tmdbPopular('movie').catch(() => empty), tmdbPopular('tv').catch(() => empty), tmdbNowPlaying().catch(() => empty), tmdbUpcoming().catch(() => empty),
  ]);
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Watch Movies 4', url: SITE_URL, potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }) }} /><CatalogHome trending={trending.results} popularMovies={popularMovies.results} popularSeries={popularSeries.results.map((x) => ({ ...x, media_type: 'tv' as const }))} latestMovies={latestMovies.results.map((x) => ({ ...x, media_type: 'movie' as const }))} upcoming={upcoming.results.map((x) => ({ ...x, media_type: 'movie' as const }))} /></>;
}
