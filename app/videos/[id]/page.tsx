import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import RelatedVideos from './RelatedVideos';
import VideoActions from '@/components/VideoActions';

export const revalidate = 300;
const SITE_URL = 'https://elovex.vercel.app';

type Video = {
  id?: string;
  title?: string;
  description?: string;
  views?: number;
  likes?: number;
  length_sec?: number;
  length_min?: string;
  duration?: string;
  published_at?: string;
  added?: string;
  embed?: string;
  embed_url?: string;
  url?: string;
  watch_url?: string;
  quality?: string;
  uploader?: string;
  channel_id?: string;
  default_thumb?: { src?: string };
  thumbs?: { src?: string }[];
  thumbnail?: string;
};

type ApiResponse = { video?: Video };

function thumbnail(video: Video) {
  return video.default_thumb?.src || video.thumbnail || video.thumbs?.[0]?.src || '';
}

function isoDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function getVideo(id: string): Promise<Video | null> {
  const response = await fetch(`${SITE_URL}/api/videos/${encodeURIComponent(id)}`, { next: { revalidate: 300 }, headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  const data = await response.json() as ApiResponse;
  return data.video || null;
}

function metadataFor(id: string, video: Video | null): Metadata {
  const title = video?.title || 'Watch Video';
  const description = video?.description || `Watch ${title} on Elovex.`;
  const image = video ? thumbnail(video) : undefined;
  const canonical = `${SITE_URL}/videos/${encodeURIComponent(id)}`;
  return {
    title,
    description,
    robots: video ? { index: true, follow: true } : { index: false, follow: true },
    alternates: { canonical },
    openGraph: { title: `${title} | Elovex`, description, type: 'video.other', url: canonical, ...(image ? { images: [{ url: image, alt: title }] } : {}) },
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return metadataFor(id, await getVideo(id));
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  const title = video.title || 'Untitled video';
  const embed = video.embed_url || video.embed || '';
  const image = thumbnail(video);
  const canonical = `${SITE_URL}/videos/${encodeURIComponent(id)}`;
  const relatedQuery = title;

  const videoSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description: video.description || `Watch ${title} on Elovex.`,
    thumbnailUrl: image ? [image] : undefined,
    embedUrl: embed || undefined,
    contentUrl: video.url || undefined,
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    duration: typeof video.length_sec === 'number' && video.length_sec > 0 ? `PT${video.length_sec}S` : undefined,
    uploadDate: isoDate(video.published_at || video.added),
    publisher: { '@type': 'Organization', name: 'Elovex', url: SITE_URL },
    interactionStatistic: video.views ? { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WatchAction', userInteractionCount: video.views } : undefined,
  };

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-red-600"><ArrowLeft className="h-4 w-4" /> Back to videos</Link>
          <Link href="/" className="text-lg font-black tracking-tight"><span className="text-zinc-950">ELO</span><span className="text-red-600">VEX</span></Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-0 sm:px-4 sm:py-5">
        <article>
          <div className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-0">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              {video.quality && <span className="rounded bg-zinc-100 px-2 py-1 font-semibold">{video.quality}</span>}
              {video.uploader && <span>{video.uploader}</span>}
            </div>
          </div>

          <div className="overflow-hidden bg-black">
            <div className="aspect-video">
              {embed ? <iframe src={embed} className="h-full w-full border-0" allow="autoplay; fullscreen; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" title={title} /> : <div className="flex h-full items-center justify-center text-zinc-500">Player unavailable</div>}
            </div>
          </div>

          <VideoActions title={title} videoId={id} views={video.views} />

          <div className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-0">
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              <span className="font-semibold text-zinc-950">{video.views?.toLocaleString() || '—'} views</span>
              {(video.length_min || video.duration) && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{video.length_min || video.duration}</span>}
            </div>
            {video.description && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-zinc-600">{video.description}</p>}
          </div>

          <RelatedVideos initialVideos={[]} query={relatedQuery} currentId={id} initialHasMore={false} />
        </article>
      </div>
    </main>
  );
}
