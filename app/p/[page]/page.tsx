import VideoPortalPage from '../../page';

export default async function PaginatedVideoPage({ params, searchParams }: { params: Promise<{ page: string }>; searchParams: Promise<{ category?: string; order?: string }> }) {
  const { page } = await params;
  const filters = await searchParams;
  const initialPage = Math.max(1, Number.parseInt(page, 10) || 1);
  return <VideoPortalPage initialPage={initialPage} initialSearch={filters.category || ''} initialOrder="latest" />;
}
