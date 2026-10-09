import { NextResponse } from 'next/server';
import { countCatalogSitemap, type CatalogCategory } from '@/lib/catalog-registry';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
const CATEGORIES: CatalogCategory[] = ['movies', 'series', 'anime'];

export const runtime = 'nodejs';
export const revalidate = 21600;

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;');
}

export async function GET() {
  // Query categories sequentially to avoid three simultaneous catalog-count
  // queries exhausting the database statement timeout during sitemap refresh.
  // If a count temporarily fails, still return a valid index and keep that
  // category's first shard discoverable instead of turning the whole sitemap
  // into a 500 response.
  const counts: Array<{ category: CatalogCategory; count: number }> = [];

  for (const category of CATEGORIES) {
    try {
      counts.push({ category, count: await countCatalogSitemap(category) });
    } catch (error) {
      console.error('[sitemap] Could not count catalog category; serving first shard as fallback', {
        category,
        error: error instanceof Error ? error.message : String(error),
      });
      counts.push({ category, count: 1 });
    }
  }

  const entries = [
    `  <sitemap><loc>${xml(`${SITE_URL}/sitemap-static.xml`)}</loc></sitemap>`,
    ...counts.flatMap(({ category, count }) => {
      // Always advertise part 0, including when a category is currently empty
      // or its estimated count could not be read.
      const parts = Math.max(1, Math.ceil(count / 1000));
      return Array.from({ length: parts }, (_, part) =>
        `  <sitemap><loc>${xml(`${SITE_URL}/sitemap/${category}/${part}.xml`)}</loc></sitemap>`,
      );
    }),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</sitemapindex>`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
    },
  });
}
