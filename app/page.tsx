import type { Metadata } from 'next';
import CatalogHome from '@/components/CatalogHome';
import AiSeoSignals from '@/components/AiSeoSignals';
import { tmdbNowPlaying, tmdbPopular, tmdbTrending, tmdbUpcoming } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Cinevero – Decide What to Watch | Movies & TV Discovery',
  description: 'Decide what to watch with Cinevero. Discover movies and TV series by mood, time, genre, pace and viewing context, with explainable recommendations.',
  keywords: ['what to watch', 'movie recommendations', 'TV recommendations', 'movies by mood', 'what movie should I watch', 'Cinevero Discover'],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Cinevero – Decide What to Watch',
    description: 'Discover movies and TV series matched to your mood, time and viewing context.',
    url: SITE_URL,
    type: 'website',
    siteName: 'Cinevero',
  },
};
const empty = { results: [] };

export default async function HomePage() {
  const [trending, popularMovies, popularSeries, latestMovies, upcoming] = await Promise.all([
    tmdbTrending('all', 'week').catch(() => empty),
    tmdbPopular('movie').catch(() => empty),
    tmdbPopular('tv').catch(() => empty),
    tmdbNowPlaying().catch(() => empty),
    tmdbUpcoming().catch(() => empty),
  ]);

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cinevero',
    url: SITE_URL,
    description: 'A movie and TV discovery platform that helps people decide what to watch based on mood, time and viewing context.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cinevero',
    url: SITE_URL,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
      <CatalogHome
        trending={trending.results}
        popularMovies={popularMovies.results}
        popularSeries={popularSeries.results.map((x) => ({ ...x, media_type: 'tv' as const }))}
        latestMovies={latestMovies.results.map((x) => ({ ...x, media_type: 'movie' as const }))}
        upcoming={upcoming.results.map((x) => ({ ...x, media_type: 'movie' as const }))}
      />
      <AiSeoSignals />
    </>
  );
}
