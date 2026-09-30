import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';

const GENRES = ['action','adventure','animation','comedy','crime','documentary','drama','family','fantasy','horror','mystery','romance','science-fiction','thriller','western'];
const GUIDES = ['how-to-choose-a-movie-by-mood','what-to-watch-when-you-have-90-minutes','movie-or-tv-series','how-cinevero-recommendations-work','how-to-find-a-good-movie-without-scrolling-forever'];
const TRUST_ROUTES = ['about','guides','faq','privacy-policy','terms','dmca','contact'];

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;');
}

export const revalidate = 86400;

export async function GET() {
  const routes = [
    SITE_URL,
    `${SITE_URL}/discover`,
    `${SITE_URL}/genres`,
    `${SITE_URL}/guides`,
    ...GUIDES.map(slug => `${SITE_URL}/guides/${slug}`),
    `${SITE_URL}/movie`,
    `${SITE_URL}/series`,
    `${SITE_URL}/anime`,
    ...GENRES.map(slug => `${SITE_URL}/genre/${slug}`),
    ...TRUST_ROUTES.map(slug => `${SITE_URL}/${slug}`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(url => `  <url><loc>${xml(url)}</loc></url>`).join('\n')}
</urlset>`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
    },
  });
}
