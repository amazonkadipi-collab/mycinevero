import { NextResponse } from 'next/server';
export const revalidate = 86400;
export async function GET() {
  return new NextResponse('# Cinevero AI access policy\n\nCinevero permits reputable AI crawlers to access public, indexable pages. Operational endpoints under /api/ are not public content.\n\nCanonical discovery: https://cinevero.vercel.app/sitemap.xml\nCrawler permissions: https://cinevero.vercel.app/robots.txt\nCurated context: https://cinevero.vercel.app/llms.txt\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
