import { NextResponse } from 'next/server';
import { getCatalogEpisodeSitemapRows } from '@/lib/catalog-registry';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;');
}

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ part: string }> },
) {
  const { part: rawPart } = await params;
  const partValue = rawPart.endsWith('.xml') ? rawPart.slice(0, -4) : rawPart;
  const part = Number(partValue);

  if (!Number.isInteger(part) || part < 0 || part > 49999) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const rows = await getCatalogEpisodeSitemapRows(part);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.map(row => {
    const url = `${SITE_URL}/series/${row.slug}/season/${row.season}/episode/${row.episode}`;
    return `  <url><loc>${xml(url)}</loc><lastmod>${xml(new Date(row.updated_at).toISOString())}</lastmod></url>`;
  }).join('\\n')}
</urlset>`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
