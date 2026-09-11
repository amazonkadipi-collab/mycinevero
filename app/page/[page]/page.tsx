import { redirect } from 'next/navigation';

export default async function LegacyPageRoute({ params, searchParams }: { params: Promise<{ page: string }>; searchParams: Promise<{ category?: string }> }) {
  const { page } = await params;
  const query = await searchParams;
  const category = query.category ? `?category=${encodeURIComponent(query.category)}` : '';
  redirect(`/p/${Math.max(1, Number.parseInt(page, 10) || 1)}${category}`);
}
