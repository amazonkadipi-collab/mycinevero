import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/'] },
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'bingbot', allow: '/' },
      { userAgent: 'Yandex', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
