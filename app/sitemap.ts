import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://elovex.vercel.app', lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
  ];
}
