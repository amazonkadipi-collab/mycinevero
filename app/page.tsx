import type { Metadata } from 'next';
import VideoPortalClient from './VideoPortalClient';
import { loadVideoListing } from '@/lib/video-listing';

const SITE_URL = 'https://elovex.vercel.app';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ category?: string; order?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category?.trim();
  const canonical = category ? `${SITE_URL}/category/${encodeURIComponent(category.toLowerCase())}` : SITE_URL;
  const label = category ? `${category} adult videos` : 'Free Adult Videos, Porn Videos & Trending Clips';
  return { title: category ? `${category} Adult Videos – Free Clips` : 'Free Adult Videos, Porn Videos & Trending Clips', description: category ? `Browse free ${category} adult videos on Elovex. Discover fresh clips, related videos, and new uploads in this category.` : 'Discover free adult videos, porn videos, trending clips, popular searches, and fresh daily uploads on Elovex.', alternates: { canonical }, robots: { index: true, follow: true, 'max-image-preview': 'large' }, openGraph: { title: `${label} | Elovex`, description: `Browse ${label} on Elovex and discover new clips.`, type: 'website', url: canonical } };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string; order?: string }> }) {
  const params = await searchParams;
  const category = params.category?.trim() || '';
  const order = ['most-popular', 'latest', 'longest', 'top-rated', 'top-monthly', 'random'].includes(params.order || '') ? params.order as string : 'latest';
  const listing = await loadVideoListing(1, category, order, 50);
  const itemList = listing.videos.slice(0, 50).map((video, index) => ({ '@type': 'ListItem', position: index + 1, url: video.id ? `${SITE_URL}/videos/${encodeURIComponent(String(video.id))}` : undefined, name: video.title || 'Adult video' })).filter((item) => item.url);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Elovex', url: SITE_URL, description: 'Free adult video discovery and watch pages.', potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }) }} />
    {itemList.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: itemList }) }} />}
    <VideoPortalClient initialPage={1} initialSearch={category} initialOrder={order} initialVideos={listing.videos} initialTotalCount={listing.totalCount} initialTotalPages={listing.totalPages} initialError={listing.error} />
  </>;
}
