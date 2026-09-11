import { redirect } from 'next/navigation';

export default async function LegacyVideoRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/videos/${encodeURIComponent(id)}`);
}
