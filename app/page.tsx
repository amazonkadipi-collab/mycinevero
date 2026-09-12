import type { Metadata } from 'next';
import VideoPortalClient from './VideoPortalClient';
import { loadVideoListing } from '@/lib/video-listing';

const SITE_URL = 'https://elovex.vercel.app';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ k?: string; category?: string; order?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const search = params.k?.trim();
  const category = params.category?.trim();
  const query = search || category;
  const canonical = search ? `${SITE_URL}/?k=${encodeURIComponent(search)}` : SITE_URL;
  const title = query ? `${query} Videos` : 'Video Discovery';
  const description = query ? `Browse videos related to ${query} on Elovex.` : 'Discover videos, trending clips, popular searches, and fresh uploads on Elovex.';
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: { title: `${title} | Elovex`, description, type: 'website', url: canonical },
  };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ k?: string; category?: string; order?: string }> }) {
  const params = await searchParams;
  const category = params.k?.trim() || params.category?.trim() || '';
  const order = ['most-popular', 'latest', 'longest', 'top-rated', 'top-monthly', 'random'].includes(params.order || '') ? params.order as string : 'latest';
  const listing = await loadVideoListing(1, category, order, 50);
  const itemList = listing.videos.slice(0, 50).map((video, index) => ({ '@type': 'ListItem', position: index + 1, url: video.id ? `${SITE_URL}/videos/${encodeURIComponent(String(video.id))}` : undefined, name: video.title || 'Video' })).filter((item) => item.url);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Elovex', url: SITE_URL, description: 'Video discovery and search platform.', potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/?k={search_term_string}`, 'query-input': 'required name=search_term_string' } }) }} />
    {itemList.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: itemList }) }} />}
    <VideoPortalClient initialPage={1} initialSearch={category} initialOrder={order} initialVideos={listing.videos} initialTotalCount={listing.totalCount} initialTotalPages={listing.totalPages} initialError={listing.error} />
  </>;
}
