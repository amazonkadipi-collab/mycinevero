const SITE_URL = 'https://elovex.vercel.app';

export type VideoItem = {
  id?: string | number;
  title?: string;
  default_thumb?: { src?: string };
  thumbs?: { src?: string }[];
  thumbnail?: string;
  thumb?: string;
  length_min?: string | number;
  duration?: string;
  views?: number;
  rate?: number | string;
  length_sec?: number;
  added?: string;
  quality?: string;
  uploader?: string;
  author?: string;
  preview?: string;
  preview_url?: string;
  preview_mp4?: string;
  pvv?: string;
};

export type VideoListing = {
  videos: VideoItem[];
  totalCount: number;
  totalPages: number;
  error?: string;
};

function getVideoList(data: any): VideoItem[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.videos)) return data.videos;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.videos)) return data.data.videos;
  if (Array.isArray(data?.response?.videos)) return data.response.videos;
  return [];
}

function getTotalCount(data: any, listLength: number): number {
  const candidates = [
    data?.total_count, data?.total, data?.totalCount,
    data?.pagination?.total, data?.pagination?.total_count,
    data?.data?.total_count, data?.data?.total,
  ];
  const value = candidates.map(Number).find((n) => Number.isFinite(n) && n >= 0);
  return value ?? listLength;
}

function getTotalPages(data: any, totalCount: number, perPage: number): number {
  const candidates = [
    data?.total_pages, data?.totalPages, data?.pages,
    data?.pagination?.total_pages, data?.pagination?.pages,
    data?.data?.total_pages, data?.data?.totalPages,
  ];
  const value = candidates.map(Number).find((n) => Number.isFinite(n) && n >= 1);
  return value ? Math.floor(value) : Math.max(1, Math.ceil(totalCount / Math.max(1, perPage)));
}

async function fetchJsonText(url: string, timeoutMs = 10000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const text = (await response.text()).replace(/^\uFEFF/, '').trim();
    let data: any = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = null; }
    }
    if (!response.ok) throw new Error(data?.error || `Video API returned HTTP ${response.status}`);
    if (!data) throw new Error('Video API returned an empty or invalid response');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export type ListingFilters = { date?: string; duration?: string; quality?: string; viewed?: string };

export async function loadVideoListing(page: number, query = '', order = 'latest', perPage = 50, filters: ListingFilters = {}): Promise<VideoListing> {
  const safePage = Math.max(1, Number(page) || 1);
  const params = new URLSearchParams({
    page: String(safePage),
    per_page: String(Math.min(100, Math.max(1, perPage))),
    order,
    thumbsize: 'small',
    lq: '1',
    format: 'json',
  });
  if (query.trim()) params.set('query', query.trim());
  else params.set('query', 'all');

  for (const [key, value] of Object.entries(filters)) if (value && value !== 'all') params.set(key, value);

  try {
    const data = await fetchJsonText(`${SITE_URL}/api/videos/search?${params.toString()}`, 12000);
    const videos = getVideoList(data);
    const totalCount = getTotalCount(data, videos.length);
    const totalPages = getTotalPages(data, totalCount, perPage);
    return { videos, totalCount, totalPages };
  } catch (error) {
    return {
      videos: [],
      totalCount: 0,
      totalPages: 1,
      error: error instanceof Error ? error.message : 'Unable to load videos',
    };
  }
}
