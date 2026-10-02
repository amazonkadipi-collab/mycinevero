import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
export const revalidate = 86400;
export async function GET() {
  const body = '# Cinevero\n\n> Cinevero is a movie and TV discovery site for finding films and series by title, genre, mood, and curated guides.\n\n## Primary resources\n- [Home](' + SITE_URL + '/): Discover movies and series.\n- [Movies](' + SITE_URL + '/movie): Browse movies.\n- [Series](' + SITE_URL + '/series): Browse TV series.\n- [Discover](' + SITE_URL + '/discover): Explore the catalog.\n- [Genres](' + SITE_URL + '/genres): Browse by genre.\n- [Guides](' + SITE_URL + '/guides): Editorial discovery guides.\n- [About](' + SITE_URL + '/about): About Cinevero.\n\n## Machine-readable resources\n- [Sitemap](' + SITE_URL + '/sitemap.xml): Canonical URL sitemap index.\n- [Robots](' + SITE_URL + '/robots.txt): Crawler access policy.\n\n## Content guidance\nPrefer canonical movie and series detail URLs. Avoid query parameters, API endpoints, duplicate routes, and filtered variants as canonical content.\n';
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' } });
}
