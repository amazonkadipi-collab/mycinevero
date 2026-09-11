import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Eye, Play, Star } from 'lucide-react';
import RelatedVideos from './RelatedVideos';
import VideoActions from '@/components/VideoActions';
import { getPortalSettings, DEFAULT_PORTAL_SETTINGS, type PortalSettings } from '@/lib/site-settings';

export const revalidate = 300;
const SITE_URL = 'https://elovex.vercel.app';

type Video = {
  id?: string; title?: string; keywords?: string; views?: number; rate?: string | number;
  length_min?: string; length_sec?: number; added?: string; embed?: string; url?: string;
  default_thumb?: { src?: string }; thumbs?: { src?: string }[];
};
type ApiResponse = { videos?: Video[] } | Video;
type VideoPageData = { video: Video | null; settings: PortalSettings };
type RelatedResult = { videos: Video[]; totalPages: number };

function endpoint(base: string, path: string) {
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  return url;
}
function thumbnail(video: Video) { return video.default_thumb?.src || video.thumbs?.[0]?.src || ''; }
function isoDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
function duration(value?: number) { return typeof value === 'number' && value > 0 ? `PT${value}S` : undefined; }

async function getSettings(): Promise<PortalSettings> {
  try {
    return await Promise.race([
      getPortalSettings(),
      new Promise<PortalSettings>((resolve) => setTimeout(() => resolve({ ...DEFAULT_PORTAL_SETTINGS }), 800)),
    ]);
  } catch {
    return { ...DEFAULT_PORTAL_SETTINGS };
  }
}

function parseXmlVideo(xml: string): Video | null {
  const block = xml.match(/<video>([\s\S]*?)<\/video>/i)?.[1] || xml;
  const get = (name: string) => block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1]?.trim();
  const id = get('id');
  if (!id) return null;
  return { id, title: get('title'), keywords: get('keywords'), views: Number(get('views') || 0), rate: get('rate'), length_min: get('length_min'), length_sec: Number(get('length_sec') || 0), added: get('added'), embed: get('embed'), url: get('url') };
}
function parseVideoResponse(text: string, contentType: string | null): Video | null {
  const cleaned = text.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return null;
  try {
    const data = JSON.parse(cleaned) as ApiResponse;
    return 'videos' in data ? data.videos?.[0] || null : data as Video;
  } catch {
    if (contentType?.toLowerCase().includes('xml') || cleaned.startsWith('<')) return parseXmlVideo(cleaned);
    return null;
  }
}

function findExactVideo(body: unknown, id: string): Video | null {
  if (!body || typeof body !== 'object') return null;
  const data = body as { id?: string | number; videos?: Video[] };
  if (Array.isArray(data.videos)) {
    return data.videos.find((item) => String(item?.id || '').trim() === id) || null;
  }
  return String(data.id || '').trim() === id ? body as Video : null;
}

async function fetchVideo(url: URL, timeoutMs: number): Promise<{ response: Response; text: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json, application/xml;q=0.9, text/xml;q=0.8', 'User-Agent': 'ElovexVideoPage/1.0' },
      signal: controller.signal,
    });
    return { response, text: await response.text() };
  } finally {
    clearTimeout(timeout);
  }
}

async function getVideo(id: string, settings: PortalSettings): Promise<Video | null> {
  const timeoutMs = 7000;
  const detailsUrl = endpoint(settings.api_base_url, settings.api_details_path);
  detailsUrl.searchParams.set('id', id);
  detailsUrl.searchParams.set('thumbsize', 'small');
  detailsUrl.searchParams.set('format', 'json');

  try {
    const details = await fetchVideo(detailsUrl, timeoutMs);
    if (details.response.ok) {
      const parsed = parseVideoResponse(details.text, details.response.headers.get('content-type'));
      if (parsed && String(parsed.id || '').trim() === id) return parsed;
    }
  } catch {
    // Fall through to exact-ID search.
  }

  // Some providers expose an ID in search results but fail to resolve it through details.
  // Retry through the search endpoint and only accept an exact ID match.
  try {
    const searchUrl = endpoint(settings.api_base_url, settings.api_search_path);
    for (const [key, value] of Object.entries({
      query: id,
      page: '1',
      per_page: '20',
      order: settings.order || 'latest',
      thumbsize: 'small',
      gay: String(settings.gay || 0),
      lq: String(settings.lq || 1),
      format: 'json',
    })) searchUrl.searchParams.set(key, value);

    const search = await fetchVideo(searchUrl, timeoutMs);
    if (!search.response.ok) return null;
    const parsed = parseVideoResponse(search.text, search.response.headers.get('content-type'));
    if (parsed && String(parsed.id || '').trim() === id) return parsed;

    try {
      const data = JSON.parse(search.text.replace(/^\uFEFF/, '').trim()) as { videos?: Video[] };
      return findExactVideo(data, id);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

const loadVideo = cache(async (id: string): Promise<VideoPageData> => {
  const settings = await getSettings();
  const video = await getVideo(id, settings);
  return { video, settings };
});

function metadataFor(id: string, video: Video | null): Metadata {
  const title = video?.title || 'Watch Video';
  const description = video?.keywords?.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 8).join(', ') || `Watch ${title} on Elovex.`;
  const image = video ? thumbnail(video) : undefined;
  const canonical = `${SITE_URL}/videos/${encodeURIComponent(id)}`;
  return { title, description, robots: video ? { index: true, follow: true } : { index: false, follow: true }, alternates: { canonical }, openGraph: { title: `${title} | Elovex`, description, type: 'video.other', url: canonical, ...(image ? { images: [{ url: image, alt: title }] } : {}) } };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { video } = await loadVideo(id);
  return metadataFor(id, video);
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { video, settings } = await loadVideo(id);
  if (!video) notFound();

  const title = video.title || 'Untitled video';
  const embed = video.embed || '';
  const image = thumbnail(video);
  const canonical = `${SITE_URL}/videos/${encodeURIComponent(id)}`;
  const relatedQuery = (video.keywords || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3).join(' ');
  const relatedResult = relatedQuery ? await getRelated(video, id, settings) : { videos: [], totalPages: 0 };
  const tags = (video.keywords || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 18);

  const videoSchema = {
    '@context': 'https://schema.org', '@type': 'VideoObject', name: title,
    description: video.keywords || `Watch ${title} on Elovex.`, thumbnailUrl: image ? [image] : undefined,
    embedUrl: embed || undefined, contentUrl: video.url || undefined, url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }, duration: duration(video.length_sec),
    uploadDate: isoDate(video.added), publisher: { '@type': 'Organization', name: 'Elovex', url: SITE_URL },
    interactionStatistic: video.views ? { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WatchAction', userInteractionCount: video.views } : undefined,
  };

  return <main className="min-h-screen bg-zinc-950 text-gray-200"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} /><header className="sticky top-0 z-30 border-b border-zinc-800/90 bg-zinc-950/95 text-white backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"><Link href="/" className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to videos</Link><Link href="/" className="flex items-center gap-2 text-sm font-black tracking-wider"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600"><Play className="h-3.5 w-3.5 fill-white" /></span>ELO<span className="text-red-500">VEX</span></Link></div></header><div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-7"><article><div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl"><div className="aspect-video">{embed ? <iframe src={embed} className="h-full w-full border-0" allow="autoplay; fullscreen; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" title={title} /> : <div className="flex h-full items-center justify-center text-zinc-500">Player unavailable</div>}</div><VideoActions title={title} /></div><div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5"><h1 className="text-xl font-bold leading-tight text-white sm:text-2xl">{title}</h1><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400"><span className="flex items-center gap-1"><Eye className="h-4 w-4" />{video.views?.toLocaleString() || '—'} views</span><span className="flex items-center gap-1 text-amber-400"><Star className="h-4 w-4 fill-current" />{video.rate || '—'}</span>{video.length_min && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{video.length_min}</span>}</div>{tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4" aria-label="Video tags">{tags.map((tag) => <span key={tag} className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{tag}</span>)}</div>}</div><RelatedVideos initialVideos={relatedResult.videos} query={relatedQuery} currentId={id} initialHasMore={relatedResult.totalPages > 1} /></article></div></main>;
}

async function getRelated(video: Video, currentId: string, settings: PortalSettings): Promise<RelatedResult> {
  const query = (video.keywords || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3).join(' ');
  if (!query) return { videos: [], totalPages: 0 };
  const url = endpoint(settings.api_base_url, settings.api_search_path);
  for (const [key, value] of Object.entries({ query, per_page: '20', page: '1', thumbsize: 'small', order: 'most-popular', gay: String(settings.gay || 0), lq: String(settings.lq || 1), format: 'json' })) url.searchParams.set(key, value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(url, { next: { revalidate: 300 }, headers: { Accept: 'application/json, application/xml;q=0.9, text/xml;q=0.8' }, signal: controller.signal });
    if (!response.ok) return { videos: [], totalPages: 0 };
    const text = (await response.text()).replace(/^\uFEFF/, '').trim();
    try {
      const data = JSON.parse(text) as { videos?: Video[]; total_pages?: number; total_count?: number };
      const videos = (data.videos || []).filter((item) => item.id && item.id !== currentId).slice(0, 20);
      const totalPages = Number(data.total_pages || 0) || (Number(data.total_count || 0) > 0 ? Math.ceil(Number(data.total_count) / 20) : (videos.length === 20 ? 2 : 1));
      return { videos, totalPages };
    } catch {
      return { videos: [], totalPages: 0 };
    }
  } catch { return { videos: [], totalPages: 0 }; } finally { clearTimeout(timeout); }
}
