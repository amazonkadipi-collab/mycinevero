import type { Metadata } from 'next';
import Link from 'next/link';
import VideoPortalClient from './VideoPortalClient';
import { loadVideoListing } from '@/lib/video-listing';

const SITE_URL = 'https://elovex.vercel.app';

const categories = [
  ['amateur', 'Amateur'], ['anal', 'Anal'], ['asian', 'Asian'], ['bbw', 'BBW'], ['big tits', 'Big Tits'],
  ['blonde', 'Blonde'], ['brunette', 'Brunette'], ['cosplay', 'Cosplay'], ['couples', 'Couples'], ['gay', 'Gay'],
  ['lesbian', 'Lesbian'], ['mature', 'Mature'], ['milf', 'MILF'], ['public', 'Public'], ['redhead', 'Redhead'],
  ['solo', 'Solo'], ['threesome', 'Threesome'], ['vintage', 'Vintage'], ['webcam', 'Webcam'],
] as const;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ category?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category?.trim();
  const label = category ? `${category} videos` : 'Free Adult Videos & Trending Clips';
  const canonical = category ? `${SITE_URL}/?category=${encodeURIComponent(category)}` : SITE_URL;
  return {
    title: category ? `${category} Videos` : 'Free Adult Videos & Trending Clips',
    description: category ? `Browse free ${category} videos on Elovex and discover fresh clips and related watch pages.` : 'Discover free adult videos, trending clips, popular searches, and fresh daily entertainment on Elovex.',
    alternates: { canonical },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: { title: `${label} | Elovex`, description: `Browse ${label} on Elovex.`, type: 'website', url: canonical },
  };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const category = params.category?.trim() || '';
  const listing = await loadVideoListing(1, category, 'latest', 50);

  const itemList = listing.videos.slice(0, 50).map((video, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: video.id ? `${SITE_URL}/videos/${encodeURIComponent(String(video.id))}` : undefined,
    name: video.title || 'Adult video',
  })).filter((item) => item.url);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Elovex',
      url: SITE_URL,
      description: 'Free adult video discovery and watch pages.',
      potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/?category={search_term_string}`, 'query-input': 'required name=search_term_string' },
    }) }} />
    {itemList.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: itemList }) }} />}

    <section className="mx-auto max-w-[1400px] px-4 pt-4 lg:px-6" aria-label="Browse categories">
      <div className="flex flex-wrap gap-2">
        {categories.map(([value, label]) => <Link key={value} href={`/?category=${encodeURIComponent(value)}`} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 hover:border-red-300 hover:text-red-600">{label}</Link>)}
      </div>
    </section>

    <VideoPortalClient
      initialPage={1}
      initialSearch={category}
      initialOrder="latest"
      initialVideos={listing.videos}
      initialTotalCount={listing.totalCount}
      initialTotalPages={listing.totalPages}
      initialError={listing.error}
    />
  </>;
}
