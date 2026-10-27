import { NextResponse } from 'next/server';
import { countCatalogEpisodeSitemap, countCatalogSitemap, type CatalogCategory } from '@/lib/catalog-registry';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
const CATEGORIES: CatalogCategory[] = ['movies', 'series', 'anime'];

export const runtime = 'nodejs';
// The sitemap index reads live catalog counts. Keep it request-time so a build
// without production database credentials cannot freeze an incomplete sitemap.
export const dynamic = 'force-dynamic';

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;');
}

export async function GET() {
  // Query categories sequentially to avoid three simultaneous catalog-count
  // queries exhausting the database statement timeout during sitemap refresh.
  // If any count fails, return 503 rather than publishing a partial sitemap index.
  const counts: Array<{ category: CatalogCategory; count: number }> = [];
  let episodeCount = 0;
  let countFailed = false;

  for (const category of CATEGORIES) {
    try {
      counts.push({ category, count: await countCatalogSitemap(category) });
    } catch (error) {
      countFailed = true;
      console.error('[sitemap] Could not count catalog category; refusing to publish an incomplete sitemap index', {
        category,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  try {
    episodeCount = await countCatalogEpisodeSitemap();
  } catch (error) {
    countFailed = true;
    console.error('[sitemap] Could not count episode sitemap rows', error instanceof Error ? error.message : String(error));
  }

  if (countFailed) {
    return new NextResponse('Sitemap temporarily unavailable. Please retry shortly.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '300',
      },
    });
  }

  const entries = [
    `  <sitemap><loc>${xml(`${SITE_URL}/sitemap-static.xml`)}</loc></sitemap>`,
    ...counts.flatMap(({ category, count }) => {
      // Always advertise part 0, including when a category is currently empty.
      const parts = Math.max(1, Math.ceil(count / 1000));
      return Array.from({ length: parts }, (_, part) =>
        `  <sitemap><loc>${xml(`${SITE_URL}/sitemap/${category}/${part}.xml`)}</loc></sitemap>`,
      );
    }),
    ...Array.from({ length: Math.max(1, Math.ceil(episodeCount / 1000)) }, (_, part) =>
      `  <sitemap><loc>${xml(`${SITE_URL}/sitemap/episodes/${part}.xml`)}</loc></sitemap>`,
    ),
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
