import type { Metadata } from 'next';
import VideoPortalClient from '../../VideoPortalClient';
import { loadVideoListing } from '@/lib/video-listing';

const SITE_URL = 'https://elovex.vercel.app';

export async function generateMetadata({ params, searchParams }: { params: Promise<{ page: string }>; searchParams: Promise<{ category?: string; order?: string }> }): Promise<Metadata> {
  const { page } = await params;
  const filters = await searchParams;
  const number = Math.max(1, Number.parseInt(page, 10) || 1);
  const category = filters.category?.trim();
  const order = filters.order?.trim();
  const label = category ? `${category} videos` : 'Adult videos';
  const query = new URLSearchParams(); if (category) query.set('category', category); if (order) query.set('order', order);
  const canonical = `${SITE_URL}/p/${number}${query.toString() ? `?${query.toString()}` : ''}`;
  return { title: `${label} – Page ${number}`, description: `Browse ${label} on Elovex. Explore fresh videos with fast pagination and related watch pages.`, alternates: { canonical }, robots: { index: true, follow: true } };
}

export default async function PaginatedVideoPage({ params, searchParams }: { params: Promise<{ page: string }>; searchParams: Promise<{ category?: string; order?: string }> }) {
  const { page } = await params;
  const filters = await searchParams;
  const initialPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const category = filters.category?.trim() || '';
  const order = ['most-popular', 'latest', 'longest', 'top-rated', 'top-monthly', 'random'].includes(filters.order || '') ? filters.order as string : 'latest';
  const listing = await loadVideoListing(initialPage, category, order, 50);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${category ? `${category} videos` : 'Adult videos'} – Page ${initialPage}`,
      url: `${SITE_URL}/p/${initialPage}?${new URLSearchParams({ ...(category ? { category } : {}), order }).toString()}`,
      isPartOf: { '@type': 'WebSite', name: 'Elovex', url: SITE_URL },
    }) }} />
    <VideoPortalClient initialPage={initialPage} initialSearch={category} initialOrder={order} initialVideos={listing.videos} initialTotalCount={listing.totalCount} initialTotalPages={listing.totalPages} initialError={listing.error} />
  </>;
}
