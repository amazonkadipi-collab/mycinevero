import type { MetadataRoute } from 'next';
import { getPortalSettings } from '@/lib/site-settings';

const SITE_URL = 'https://elovex.vercel.app';
const MAX_URLS_PER_SITEMAP = 45000;
const API_PAGE_SIZE = 1000;
const MAX_CATEGORY_PAGES = 100;
const REQUEST_TIMEOUT_MS = 15000;

const categories = ['amateur', 'anal', 'asian', 'bbw', 'big tits', 'blonde', 'brunette', 'cosplay', 'couples', 'gay', 'lesbian', 'mature', 'milf', 'public', 'redhead', 'solo', 'threesome', 'vintage', 'webcam'];

type ApiVideo = { id?: string; added?: string };
type ApiResult = { videos?: ApiVideo[]; total_count?: number; total_pages?: number };

function endpoint(base: string, path: string) {
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  return url;
}

async function fetchApiPage(page: number, category?: string): Promise<ApiResult> {
  const settings = await getPortalSettings();
  const url = endpoint(settings.api_base_url, settings.api_search_path);
  url.searchParams.set('query', category || settings.query || 'all');
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(API_PAGE_SIZE));
  url.searchParams.set('order', settings.order || 'latest');
  url.searchParams.set('thumbsize', 'small');
  url.searchParams.set('gay', String(category?.toLowerCase() === 'gay' ? 2 : settings.gay || 0));
  url.searchParams.set('lq', String(settings.lq || 1));
  url.searchParams.set('format', 'json');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json, application/xml;q=0.9, text/xml;q=0.8' }, signal: controller.signal });
    if (!response.ok) return {};
    const text = (await response.text()).replace(/^\uFEFF/, '').trim();
    try {
      return JSON.parse(text) as ApiResult;
    } catch {
      return {};
    }
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
  return { total, pages: pages || (total > 0 ? Math.ceil(total / API_PAGE_SIZE) : 0) };
}

async function getCategoryPages() {
  const results = await Promise.all(categories.map(async (category) => {
    const first = await fetchApiPage(1, category);
    const total = Number(first.total_count || 0);
    const totalPages = Number(first.total_pages || 0) || (total > 0 ? Math.ceil(total / API_PAGE_SIZE) : 1);
    return { category, totalPages: Math.min(MAX_CATEGORY_PAGES, Math.max(1, totalPages)) };
  }));
  return results;
}

export const revalidate = 3600;

export async function generateSitemaps() {
  const { total } = await getTotalVideos();
  const sitemapCount = Math.max(1, Math.ceil(total / MAX_URLS_PER_SITEMAP));
  return Array.from({ length: sitemapCount }, (_, id) => ({ id }));
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

  if (sitemapId !== 0) return videoEntries;

  const categoryPages = await getCategoryPages();
  const categoryEntries: MetadataRoute.Sitemap = [];
  for (const { category, totalPages } of categoryPages) {
    categoryEntries.push({
      url: `${SITE_URL}/?category=${encodeURIComponent(category)}`,
      changeFrequency: 'hourly',
      priority: 0.8,
    });
    for (let page = 2; page <= totalPages; page += 1) {
      categoryEntries.push({
        url: `${SITE_URL}/p/${page}?category=${encodeURIComponent(category)}`,
        changeFrequency: 'daily',
        priority: 0.6,
      });
    }
  }

  return [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    ...categoryEntries,
    ...videoEntries,
  ];
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
