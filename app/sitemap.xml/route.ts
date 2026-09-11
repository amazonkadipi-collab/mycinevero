import { NextResponse } from 'next/server';

const SITE_URL = 'https://elovex.vercel.app';

export const revalidate = 3600;

export async function GET() {
  const parts = Array.from({ length: 3 }, (_, id) => `  <sitemap><loc>${SITE_URL}/sitemap/${id}.xml</loc></sitemap>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${parts}\n</sitemapindex>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
