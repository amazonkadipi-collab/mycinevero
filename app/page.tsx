import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VideoPortalClient from './VideoPortalClient';
import { loadVideoListing } from '@/lib/video-listing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://elovex.vercel.app';

type SearchParams = { k?: string; category?: string; order?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const params = await searchParams;
  const search = params.k?.trim();
  const canonical = search ? `${SITE_URL}/?k=${encodeURIComponent(search)}` : SITE_URL;
  const title = search ? `${search} Movies & Series` : 'Movies & Series Streaming';
  const description = search ? `Browse titles related to ${search} on Elovex.` : 'Discover movies and series from your private Elovex catalogue.';
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: { title: `${title} | Elovex`, description, type: 'website', url: canonical },
  };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  // Legacy category query URLs must disappear rather than continuing to expose
  // the old taxonomy. Let Next.js return a real HTTP 404 for these URLs.
  if (params.category?.trim()) notFound();

  const search = params.k?.trim() || '';
  const order = ['most-popular', 'latest', 'longest', 'top-rated', 'top-monthly', 'random'].includes(params.order || '') ? params.order as string : 'latest';
  const listing = await loadVideoListing(1, search, order, 24);
  const itemList = listing.videos.slice(0, 50).map((video, index) => ({ '@type': 'ListItem', position: index + 1, url: video.id ? `${SITE_URL}/videos/${encodeURIComponent(String(video.id))}` : undefined, name: video.title || 'Video' })).filter((item) => item.url);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Elovex', url: SITE_URL, description: 'Video discovery and search platform.', potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/?k={search_term_string}`, 'query-input': 'required name=search_term_string' } }) }} />
    {itemList.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: itemList }) }} />}
    <VideoPortalClient initialPage={1} initialSearch={search} initialOrder={order} initialVideos={listing.videos} initialTotalPages={listing.totalPages} initialError={listing.error} />
  </>;
}
