import type { MetadataRoute } from 'next';

const SITE_URL = 'https://elovex.vercel.app';
const MAX_URLS_PER_SITEMAP = 45000;
const API_PAGE_SIZE = 1000;
const REQUEST_TIMEOUT_MS = 20000;

type ApiVideo = { id?: string; added?: string };
type ApiResult = { videos?: ApiVideo[]; total_count?: number; total_pages?: number };

async function fetchApiPage(page: number): Promise<ApiResult> {
  const url = new URL('/api/videos/search', SITE_URL);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(API_PAGE_SIZE));
  url.searchParams.set('order', 'latest');
  url.searchParams.set('thumbsize', 'small');
  url.searchParams.set('lq', '1');
  url.searchParams.set('query', 'all');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) return {};
    const text = (await response.text()).replace(/^\uFEFF/, '').trim();
    if (!text) return {};
    try { return JSON.parse(text) as ApiResult; } catch { return {}; }
  } catch { return {}; } finally { clearTimeout(timeout); }
}

async function getTotalVideos() {
  const first = await fetchApiPage(1);
  const total = Number(first.total_count || 0);
  const pages = Number(first.total_pages || 0);
  return { total, pages: pages || (total > 0 ? Math.ceil(total / API_PAGE_SIZE) : 0) };
}

export const revalidate = 3600;

export async function generateSitemaps() {
  const { total } = await getTotalVideos();
  return Array.from({ length: Math.max(1, Math.ceil(total / MAX_URLS_PER_SITEMAP)) }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id?: number }): Promise<MetadataRoute.Sitemap> {
  const sitemapId = Math.max(0, Number(id || 0));
  const firstVideoIndex = sitemapId * MAX_URLS_PER_SITEMAP;
  const firstPage = Math.floor(firstVideoIndex / API_PAGE_SIZE) + 1;
  const lastPage = Math.ceil((firstVideoIndex + MAX_URLS_PER_SITEMAP) / API_PAGE_SIZE);
  const pages = Array.from({ length: Math.max(0, lastPage - firstPage + 1) }, (_, index) => firstPage + index);
  const videos: ApiVideo[] = [];
  for (let i = 0; i < pages.length; i += 5) {
    const batch = await Promise.all(pages.slice(i, i + 5).map((page) => fetchApiPage(page)));
    for (const result of batch) videos.push(...(result.videos || []));
  }
  const startOffset = firstVideoIndex - (firstPage - 1) * API_PAGE_SIZE;
  const selected = videos.slice(Math.max(0, startOffset), startOffset + MAX_URLS_PER_SITEMAP);
  const videoEntries = selected.map(videoEntry).filter(Boolean) as MetadataRoute.Sitemap;
  return sitemapId === 0 ? [{ url: SITE_URL, changeFrequency: 'hourly', priority: 1 }, ...videoEntries] : videoEntries;
}

function videoEntry(video: ApiVideo): MetadataRoute.Sitemap[number] | null {
  const id = String(video.id || '').trim();
  if (!id) return null;
  const rawAdded = video.added ? video.added.replace(' ', 'T') : '';
  const date = rawAdded ? new Date(rawAdded) : null;
  const lastModified = date && !Number.isNaN(date.getTime()) ? date : undefined;
  return { url: `${SITE_URL}/videos/${encodeURIComponent(id)}`, ...(lastModified ? { lastModified } : {}), changeFrequency: 'weekly', priority: 0.7 };
}
