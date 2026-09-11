import type { Metadata } from 'next';
import Link from 'next/link';
import VideoPortalClient from '../../VideoPortalClient';
import { VIDEO_CATEGORIES, getCategoryLabel } from '@/lib/categories';
import { loadVideoListing } from '@/lib/video-listing';

const SITE_URL = 'https://elovex.vercel.app';

export function generateStaticParams() {
  return VIDEO_CATEGORIES.map(([category]) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const slug = decodeURIComponent(category).trim().toLowerCase();
  const label = getCategoryLabel(slug);
  const canonical = `${SITE_URL}/category/${encodeURIComponent(slug)}`;
  return {
    title: `${label} Videos | Elovex`,
    description: `Browse free ${label} videos on Elovex. Discover fresh clips, popular videos, and related ${label} watch pages.`,
    alternates: { canonical },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: { title: `${label} Videos | Elovex`, description: `Browse free ${label} videos on Elovex.`, type: 'website', url: canonical },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const slug = decodeURIComponent(category).trim().toLowerCase();
  const known = VIDEO_CATEGORIES.some(([value]) => value === slug);
  if (!known) return null;

  const label = getCategoryLabel(slug);
  const listing = await loadVideoListing(1, slug, 'latest', 50);
  const canonical = `${SITE_URL}/category/${encodeURIComponent(slug)}`;
  const itemList = listing.videos.slice(0, 50).map((video, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: video.id ? `${SITE_URL}/videos/${encodeURIComponent(String(video.id))}` : undefined,
    name: video.title || `${label} video`,
  })).filter((item) => item.url);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${label} Videos`,
      url: canonical,
      description: `Free ${label} videos on Elovex.`,
      isPartOf: { '@type': 'WebSite', name: 'Elovex', url: SITE_URL },
    }) }} />
    {itemList.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: itemList }) }} />}

    <main>
      <section className="mx-auto max-w-[1400px] px-4 pt-5 lg:px-6">
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-zinc-500">
          <Link href="/" className="hover:text-red-600">Home</Link><span className="px-2">/</span><span>{label}</span>
        </nav>
        <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h1 className="text-2xl font-bold sm:text-3xl">{label} Videos</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">Browse free {label.toLowerCase()} videos on Elovex, including fresh clips and popular watch pages.</p>
        </div>
        <nav aria-label="Related categories" className="mb-4 flex flex-wrap gap-2">
          {VIDEO_CATEGORIES.map(([value, categoryLabel]) => <Link key={value} href={`/category/${encodeURIComponent(value)}`} className={`rounded-full border px-3 py-1.5 text-xs ${value === slug ? 'border-red-600 bg-red-600 text-white' : 'border-zinc-200 bg-white text-zinc-600 hover:border-red-300 hover:text-red-600'}`}>{categoryLabel}</Link>)}
        </nav>
      </section>

      <VideoPortalClient
        initialPage={1}
        initialSearch={slug}
        initialOrder="latest"
        initialVideos={listing.videos}
        initialTotalCount={listing.totalCount}
        initialTotalPages={listing.totalPages}
        initialError={listing.error}
        canonicalBase={`/category/${encodeURIComponent(slug)}`}
      />
    </main>
  </>;
}
