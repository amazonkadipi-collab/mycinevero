import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock, Eye, ExternalLink, Play, Star } from 'lucide-react';
import { getPortalSettings } from '@/lib/site-settings';

type Video = {
  id?: string;
  title?: string;
  keywords?: string;
  views?: number;
  rate?: string | number;
  length_min?: string;
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

async function getVideo(id: string): Promise<Video | null> {
  const settings = await getPortalSettings();
  if (!settings.api_base_url) return null;
  const url = endpoint(settings.api_base_url, settings.api_details_path);
  url.searchParams.set('id', id);
  url.searchParams.set('thumbsize', 'big');
  url.searchParams.set('format', 'json');
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) return null;
  const data = (await response.json()) as ApiResponse;
  return 'videos' in data ? data.videos?.[0] || null : data as Video;
}

async function getRelated(video: Video): Promise<Video[]> {
  const settings = await getPortalSettings();
  if (!settings.api_base_url) return [];
  const url = endpoint(settings.api_base_url, settings.api_search_path);
  const keywords = video.keywords?.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 2).join(' ') || 'all';
  url.searchParams.set('query', keywords);
  url.searchParams.set('page', '1');
  url.searchParams.set('per_page', '8');
  url.searchParams.set('thumbsize', 'medium');
  url.searchParams.set('order', 'most-popular');
  url.searchParams.set('gay', String(settings.gay));
  url.searchParams.set('lq', String(settings.lq));
  url.searchParams.set('format', 'json');
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) return [];
  const data = (await response.json()) as { videos?: Video[] };
  return (data.videos || []).filter((item) => item.id && item.id !== video.id).slice(0, 6);
}

function thumbnail(video: Video) {
  return video.default_thumb?.src || video.thumbs?.[0]?.src || '';
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideo(id);
  const title = video?.title || 'Watch Video';
  const description = video?.keywords
    ? `${title}. Watch the video and discover related content on Video Portal.`
    : `Watch ${title} online and discover related videos on Video Portal.`;
  const image = video ? thumbnail(video) : '';
  return {
    title: `${title} | Elovex`,
    description,
    keywords: video?.keywords?.split(',').map((keyword) => keyword.trim()),
    openGraph: { title: `${title} | Elovex`, description, type: 'video.other', images: image ? [image] : undefined },
  };
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) {
    return <main className="min-h-screen bg-zinc-900 p-8 text-center text-zinc-300"><h1 className="text-2xl font-bold text-white">Video unavailable</h1><Link href="/" className="mt-4 inline-block text-red-400 hover:text-red-300">Back to videos</Link></main>;
  }
  const related = await getRelated(video);
  const title = video.title || 'Untitled video';
  const embed = video.embed || '';

  return (
    <main className="min-h-screen bg-zinc-900 text-gray-200">
      <header className="border-b border-red-950/80 bg-red-800 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"><Link href="/" className="flex items-center gap-2 text-sm text-red-100 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to videos</Link><div className="text-sm font-black tracking-wider">ELO<span className="ml-1 text-red-400">VEX</span></div></div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-xl"><div className="aspect-video">{embed ? <iframe src={embed} className="h-full w-full border-0" allow="autoplay; fullscreen" allowFullScreen title={title} /> : <div className="flex h-full items-center justify-center text-zinc-500">Player unavailable</div>}</div></div>
            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5"><h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1><div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400"><span className="flex items-center gap-1"><Eye className="h-4 w-4" />{video.views?.toLocaleString() || '—'} views</span><span className="flex items-center gap-1 text-amber-400"><Star className="h-4 w-4 fill-current" />{video.rate || '—'}</span>{video.length_min && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{video.length_min}</span>}</div>{video.keywords && <p className="mt-5 border-t border-zinc-800 pt-4 text-sm leading-6 text-zinc-400">{video.keywords}</p>}<div className="mt-5 flex gap-3"><Link href="/" className="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700">More videos</Link>{video.url && <a href={video.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500">Source <ExternalLink className="h-3.5 w-3.5" /></a>}</div></div>
          </article>
          <aside><h2 className="mb-4 text-lg font-bold text-white">Related videos</h2><div className="space-y-3">{related.map((item) => <Link key={item.id} href={`/videos/${item.id}`} className="group flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-2 hover:border-red-700/60"><div className="relative h-20 w-32 shrink-0 overflow-hidden rounded bg-black">{thumbnail(item) ? <img src={thumbnail(item)} alt={item.title || 'Related video'} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" /> : <Play className="m-8 h-5 w-5 text-zinc-600" />}</div><div className="min-w-0"><h3 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-red-300">{item.title || 'Untitled video'}</h3><p className="mt-2 text-xs text-zinc-500">{item.views?.toLocaleString() || '—'} views</p></div></Link>)}</div></aside>
        </div>
      </div>
    </main>
  );
}
