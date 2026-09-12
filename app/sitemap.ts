import type { MetadataRoute } from 'next';
import { latestCatalog } from '@/lib/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://watchmovies4.vercel.app';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const titles = await latestCatalog(5000).catch(() => []);
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/movie`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/series`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/search`, changeFrequency: 'weekly', priority: 0.4 },
  ];
  for (const title of titles) {
    const lastModified = title.updated_at ?? title.last_synced_at ?? undefined;
    entries.push({ url: `${SITE_URL}/${title.media_type === 'tv' ? 'series' : 'movie'}/${title.slug}`, lastModified, changeFrequency: 'weekly', priority: 0.7 });
  }
  return entries;
}
