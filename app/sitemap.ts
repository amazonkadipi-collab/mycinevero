import type { MetadataRoute } from 'next';
import { getPortalSettings } from '@/lib/site-settings';

const SITE_URL = 'https://elovex.vercel.app';
const MAX_URLS_PER_SITEMAP = 45000;
const API_PAGE_SIZE = 1000;
const REQUEST_TIMEOUT_MS = 15000;

const categories = ['amateur', 'anal', 'asian', 'bbw', 'big tits', 'blonde', 'brunette', 'cosplay', 'couples', 'gay', 'lesbian', 'mature', 'milf', 'public', 'redhead', 'solo', 'threesome', 'vintage', 'webcam'];

type ApiVideo = { id?: string; added?: string };
type ApiResult = { videos?: ApiVideo[]; total_count?: number; total_pages?: number };

function endpoint(base: string, path: string) {
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  return url;
}

async function fetchApiPage(page: number): Promise<ApiResult> {
  const settings = await getPortalSettings();
  const url = endpoint(settings.api_base_url, settings.api_search_path);
  url.searchParams.set('query', settings.query || 'all');
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(API_PAGE_SIZE));
  url.searchParams.set('order', settings.order || 'latest');
  url.searchParams.set('thumbsize', 'small');
  url.searchParams.set('gay', String(settings.gay || 0));
  url.searchParams.set('lq', String(settings.lq || 1));
  url.searchParams.set('format', 'json');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) return {};
    return await response.json() as ApiResult;
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

async function getTotalVideos() {
  const first = await fetchApiPage(1);
  const total = Number(first.total_count || 0);
  const pages = Number(first.total_pages || 0);
  if (total > 0) return { total, pages: pages || Math.ceil(total / API_PAGE_SIZE) };
  return { total: 0, pages: 0 };
}

export const revalidate = 3600;

export async function generateSitemaps() {
  const { total } = await getTotalVideos();
  const sitemapCount = Math.max(1, Math.ceil(total / MAX_URLS_PER_SITEMAP));
  return Array.from({ length: sitemapCount }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id?: number }): Promise<MetadataRoute.Sitemap> {
  const baseEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    ...categories.map((category) => ({
      url: `${SITE_URL}/?category=${encodeURIComponent(category)}`,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    })),
  ];

  const sitemapId = Math.max(0, Number(id || 0));
  const firstVideoIndex = sitemapId * MAX_URLS_PER_SITEMAP;
  const firstPage = Math.floor(firstVideoIndex / API_PAGE_SIZE) + 1;
  const lastVideoIndex = firstVideoIndex + MAX_URLS_PER_SITEMAP;
  const lastPage = Math.ceil(lastVideoIndex / API_PAGE_SIZE);

  if (sitemapId === 0) {
    const first = await fetchApiPage(1);
    const videos = first.videos || [];
    const entries = videos.map((video) => videoEntry(video)).filter(Boolean) as MetadataRoute.Sitemap;
    return [...baseEntries, ...entries];
  }

  const pages: number[] = [];
  for (let page = firstPage; page <= lastPage; page++) pages.push(page);

  const videos: ApiVideo[] = [];
  for (let i = 0; i < pages.length; i += 5) {
    const batch = await Promise.all(pages.slice(i, i + 5).map(fetchApiPage));
    for (const result of batch) videos.push(...(result.videos || []));
  }

  const startOffset = firstVideoIndex - (firstPage - 1) * API_PAGE_SIZE;
  const selected = videos.slice(Math.max(0, startOffset), startOffset + MAX_URLS_PER_SITEMAP);
  return selected.map((video) => videoEntry(video)).filter(Boolean) as MetadataRoute.Sitemap;
}

function videoEntry(video: ApiVideo): MetadataRoute.Sitemap[number] | null {
  const id = String(video.id || '').trim();
  if (!id) return null;
  const rawAdded = video.added ? video.added.replace(' ', 'T') : '';
  const date = rawAdded ? new Date(rawAdded) : null;
  const lastModified = date && !Number.isNaN(date.getTime()) ? date : undefined;
  return {
    url: `${SITE_URL}/videos/${encodeURIComponent(id)}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: 'weekly',
    priority: 0.7,
  };
}
