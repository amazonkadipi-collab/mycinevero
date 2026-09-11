import type { Metadata } from 'next';
import VideoPortalClient from '../VideoPortalClient';
import { loadVideoListing } from '@/lib/video-listing';

const SITE_URL = 'https://elovex.vercel.app';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() || '';
  return {
    title: query ? `Search results for ${query} | Elovex` : 'Search Videos | Elovex',
    description: query ? `Search Elovex for ${query} videos and discover matching watch pages.` : 'Search Elovex for adult videos and discover matching watch pages.',
    alternates: { canonical: query ? `${SITE_URL}/search?q=${encodeURIComponent(query)}` : `${SITE_URL}/search` },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() || '';
  const listing = await loadVideoListing(1, query, 'most-popular', 50);
  return <VideoPortalClient initialPage={1} initialSearch={query} initialOrder="most-popular" initialVideos={listing.videos} initialTotalCount={listing.totalCount} initialTotalPages={listing.totalPages} initialError={listing.error} />;
}
