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
  // Keep the sitemap index DB-light. Episode sitemap counting previously scanned the entire TV catalog
  // and could hit Supabase statement timeouts. Episode shards remain available independently.
  const counts = await Promise.all(
    CATEGORIES.map(async category => ({ category, count: await countCatalogSitemap(category) })),
  );

  const entries = [
    `  <sitemap><loc>${xml(`${SITE_URL}/sitemap-static.xml`)}</loc></sitemap>`,
    ...counts.flatMap(({ category, count }) => {
      const parts = Math.ceil(count / 1000);
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
