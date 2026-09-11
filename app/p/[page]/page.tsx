import VideoPortalPage from '../../page';

export default async function PaginatedVideoPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const initialPage = Math.max(1, Number.parseInt(page, 10) || 1);
  return <VideoPortalPage initialPage={initialPage} />;
}
