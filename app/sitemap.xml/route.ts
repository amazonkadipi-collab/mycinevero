import { NextResponse } from 'next/server';

const SITE_URL = 'https://elovex.vercel.app';
const MAX_URLS_PER_SITEMAP = 45000;
const API_URL = `${SITE_URL}/api/videos/search?query=all&category=all&page=1&per_page=1&format=json`;

export const revalidate = 3600;

async function getSitemapCount() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(API_URL, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) return 1;
    const data = await response.json() as { total_count?: number | string; total_pages?: number | string };
    const total = Number(data.total_count || 0);
    const providerPages = Number(data.total_pages || 0);
    const count = total > 0 ? Math.ceil(total / MAX_URLS_PER_SITEMAP) : (providerPages > 0 ? Math.ceil((providerPages * 1000) / MAX_URLS_PER_SITEMAP) : 1);
    return Math.max(1, count);
  } catch {
    return 1;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const count = await getSitemapCount();
  const parts = Array.from({ length: count }, (_, id) => `  <sitemap><loc>${SITE_URL}/sitemap/${id}.xml</loc></sitemap>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${parts}\n</sitemapindex>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
