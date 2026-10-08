import type { Metadata } from 'next';
import CatalogHome from '@/components/CatalogHome';
import AiSeoSignals from '@/components/AiSeoSignals';
import { tmdbAnimeHome, tmdbNowPlaying, tmdbPopular, tmdbTrending, tmdbUpcoming, type TmdbTitle } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
// Cache the homepage snapshot to avoid rebuilding six TMDB queries for every visitor.
export const revalidate = 900;
export const metadata: Metadata = {
  title: 'Cinevero – Decide What to Watch | Movies, Series & Anime Discovery',
  description: 'Decide what to watch with Cinevero. Discover movies, series and anime by mood, time, genre, pace and viewing context.',
  keywords: ['what to watch', 'movie recommendations', 'TV recommendations', 'anime recommendations', 'movies by mood', 'Cinevero Discover'],
  alternates: { canonical: SITE_URL },
  openGraph: { title: 'Cinevero – Decide What to Watch', description: 'Discover movies, series and anime matched to your mood, time and viewing context.', url: SITE_URL, type: 'website', siteName: 'Cinevero' },
};
const empty = { results: [] };

function compactHomeItems(items: TmdbTitle[], limit = 12): TmdbTitle[] {
  return items.slice(0, limit).map((item) => ({
    id: item.id,
    media_type: item.media_type,
    title: item.title,
    name: item.name,
    original_title: item.original_title,
    original_name: item.original_name,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    vote_average: item.vote_average,
  }));
}


export default async function HomePage() {
  const [trending, popularMovies, popularSeries, latestMovies, upcoming, anime] = await Promise.all([
    tmdbTrending('all', 'week').catch(() => empty),
    tmdbPopular('movie').catch(() => empty),
    tmdbPopular('tv').catch(() => empty),
    tmdbNowPlaying().catch(() => empty),
    tmdbUpcoming().catch(() => empty),
    tmdbAnimeHome().catch(() => empty),
  ]);

  const websiteLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Cinevero', url: SITE_URL, description: 'A movie, TV series and anime discovery platform that helps people decide what to watch based on mood, time and viewing context.', potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
  const organizationLd = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Cinevero', url: SITE_URL };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
    <CatalogHome trending={compactHomeItems(trending.results)} popularMovies={compactHomeItems(popularMovies.results)} popularSeries={compactHomeItems(popularSeries.results.map((x) => ({ ...x, media_type: 'tv' as const })))} latestMovies={compactHomeItems(latestMovies.results.map((x) => ({ ...x, media_type: 'movie' as const })))} upcoming={compactHomeItems(upcoming.results.map((x) => ({ ...x, media_type: 'movie' as const })))} anime={compactHomeItems(anime.results)} />
    <AiSeoSignals />
  </>;
}
