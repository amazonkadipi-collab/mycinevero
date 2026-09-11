import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock, Eye, ExternalLink, Star } from 'lucide-react';
import { getPortalSettings, type PortalSettings } from '@/lib/site-settings';

export const revalidate = 300;

type Video = {
  id?: string;
  title?: string;
  keywords?: string;
  views?: number;
  rate?: string | number;
  length_min?: string;
  length_sec?: number;
  added?: string;
  embed?: string;
  url?: string;
  default_thumb?: { src?: string };
  thumbs?: { src?: string }[];
};

type ApiResponse = { videos?: Video[]; total_count?: number; total_pages?: number } | Video;

function endpoint(base: string, path: string) {
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  return url;
}

async function getVideo(id: string, settings: PortalSettings): Promise<Video | null> {
  if (!settings.api_base_url) return null;
  const url = endpoint(settings.api_base_url, settings.api_details_path);
  url.searchParams.set('id', id);
  url.searchParams.set('thumbsize', 'small');
  url.searchParams.set('format', 'json');
  try {
    const response = await fetch(url, { next: { revalidate: 300 }, headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const data = (await response.json()) as ApiResponse;
    return 'videos' in data ? data.videos?.[0] || null : data as Video;
  } catch {
    return null;
  }
}

function thumbnail(video: Video) {
  return video.default_thumb?.src || video.thumbs?.[0]?.src || '';
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Watch Video | Elovex',
    description: 'Watch videos on Elovex and discover related trending content.',
  };
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const settings = await getPortalSettings();
  const video = await getVideo(id, settings);

  if (!video) {
    return <main className="min-h-screen bg-zinc-900 p-8 text-center text-zinc-300"><h1 className="text-2xl font-bold text-white">Video unavailable</h1><Link href="/" className="mt-4 inline-block text-red-400 hover:text-red-300">Back to videos</Link></main>;
  }

  const title = video.title || 'Untitled video';
  const embed = video.embed || '';
  const videoSchema = {
    '@context': 'https://schema.org', '@type': 'VideoObject', name: title,
    description: video.keywords || `Watch ${title} on Elovex.`, thumbnailUrl: thumbnail(video) ? [thumbnail(video)] : undefined,
    embedUrl: embed || undefined, url: `https://elovex.vercel.app/videos/${id}`,
    duration: video.length_sec ? `PT${video.length_sec}S` : undefined, uploadDate: video.added || undefined,
    interactionStatistic: video.views ? { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WatchAction', userInteractionCount: video.views } : undefined,
  };

  return (
    <main className="min-h-screen bg-zinc-900 text-gray-200">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
      <header className="border-b border-red-950/80 bg-red-800 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"><Link href="/" className="flex items-center gap-2 text-sm text-red-100 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to videos</Link><div className="text-sm font-black tracking-wider">ELO<span className="ml-1 text-red-400">VEX</span></div></div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <article>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-xl"><div className="aspect-video">{embed ? <iframe src={embed} className="h-full w-full border-0" allow="autoplay; fullscreen; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" title={title} /> : <div className="flex h-full items-center justify-center text-zinc-500">Player unavailable</div>}</div></div>
          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5"><h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1><div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400"><span className="flex items-center gap-1"><Eye className="h-4 w-4" />{video.views?.toLocaleString() || '—'} views</span><span className="flex items-center gap-1 text-amber-400"><Star className="h-4 w-4 fill-current" />{video.rate || '—'}</span>{video.length_min && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{video.length_min}</span>}</div>{video.keywords && <p className="mt-5 border-t border-zinc-800 pt-4 text-sm leading-6 text-zinc-400">{video.keywords}</p>}<div className="mt-5 flex flex-wrap gap-3"><Link href="/" className="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700">More videos</Link>{embed && <a href={embed} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Open player <ExternalLink className="h-3.5 w-3.5" /></a>}{video.url && <a href={video.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500">Source <ExternalLink className="h-3.5 w-3.5" /></a>}</div></div>
        </article>
      </div>
    </main>
  );
}
