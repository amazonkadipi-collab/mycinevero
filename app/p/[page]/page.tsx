import VideoPortalPage from '../../page';
import type { Metadata } from 'next';

const SITE_URL = 'https://elovex.vercel.app';

export async function generateMetadata({ params, searchParams }: { params: Promise<{ page: string }>; searchParams: Promise<{ category?: string }> }): Promise<Metadata> {
  const { page } = await params;
  const filters = await searchParams;
  const number = Math.max(1, Number.parseInt(page, 10) || 1);
  const category = filters.category?.trim();
  const label = category ? `${category} videos` : 'Adult videos';
  const canonical = `${SITE_URL}/p/${number}${category ? `?category=${encodeURIComponent(category)}` : ''}`;
  return { title: `${label} – Page ${number}`, description: `Browse ${label} on Elovex. Explore fresh videos with fast pagination and related watch pages.`, alternates: { canonical }, robots: { index: true, follow: true } };
}

export default async function PaginatedVideoPage({ params, searchParams }: { params: Promise<{ page: string }>; searchParams: Promise<{ category?: string; order?: string }> }) {
  const { page } = await params;
  const filters = await searchParams;
  const initialPage = Math.max(1, Number.parseInt(page, 10) || 1);
  return <VideoPortalPage initialPage={initialPage} initialSearch={filters.category || ''} initialOrder="latest" />;
}
