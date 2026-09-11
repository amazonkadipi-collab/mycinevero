import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://elovex.vercel.app';
  const categories = ['amateur', 'anal', 'asian', 'bbw', 'big-tits', 'blonde', 'brunette', 'cosplay', 'couples', 'gay', 'lesbian', 'mature', 'milf', 'public', 'redhead', 'solo', 'threesome', 'vintage', 'webcam'];
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    ...categories.map((category) => ({ url: `${base}/?category=${category}`, lastModified: now, changeFrequency: 'hourly' as const, priority: 0.8 })),
  ];
}
