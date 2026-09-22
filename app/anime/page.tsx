import type { Metadata } from 'next';
import Link from 'next/link';
import { Star, SlidersHorizontal, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { slugify, tmdbAnime, tmdbImage } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const requested = Number(pageParam);
  const page = Number.isFinite(requested) && requested > 1 ? Math.min(Math.floor(requested), 500) : 1;
  const title = page > 1 ? `Anime – Page ${page}` : 'Anime Movies & Series';
  const description = 'Discover popular anime movies and series on Cinevero, with ratings, genres, cast and direct links to every title.';
  const canonical = page > 1 ? `${SITE_URL}/anime?page=${page}` : `${SITE_URL}/anime`;
  return { title, description, alternates: { canonical }, openGraph: { title: `${title} | Cinevero`, description, url: canonical, siteName: 'Cinevero', type: 'website' }, robots: { index: true, follow: true } };
}

function titleOf(item: any) { return item.title || item.name || item.original_title || item.original_name || 'Untitled'; }
function dateOf(item: any) { return item.release_date || item.first_air_date || ''; }
function hrefOf(item: any) { const type = item.media_type === 'tv' || item.name || item.first_air_date ? 'series' : 'movie'; return `/${type}/${slugify(titleOf(item))}-${item.id}`; }

export default async function AnimePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const requested = Number(pageParam);
  const page = Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), 500) : 1;
  const [tv, movie] = await Promise.all([
    tmdbAnime('tv', page).catch(() => ({ results: [], total_pages: 0 })),
    tmdbAnime('movie', page).catch(() => ({ results: [], total_pages: 0 })),
  ]);
  const items = [...tv.results.map(x => ({ ...x, media_type: 'tv' as const })), ...movie.results.map(x => ({ ...x, media_type: 'movie' as const }))]
    .filter((item, index, all) => all.findIndex(other => other.id === item.id && other.media_type === item.media_type) === index)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  const totalPages = Math.min(Math.max(tv.total_pages || 0, movie.total_pages || 0), 500);
  const breadcrumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL }, { '@type': 'ListItem', position: 2, name: 'Anime', item: `${SITE_URL}/anime` }] };
  const collectionLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Anime Movies & Series', description: 'Popular anime movies and series on Cinevero.', url: `${SITE_URL}/anime`, isPartOf: { '@type': 'WebSite', name: 'Cinevero', url: SITE_URL }, mainEntity: { '@type': 'ItemList', itemListElement: items.slice(0, 12).map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: titleOf(item), url: `${SITE_URL}${hrefOf(item)}` })) } };

  return (
    <main className="min-h-screen bg-[#0e0e1d] text-white pb-20 sm:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[11px] font-semibold text-[#817d99]"><Link href="/" className="hover:text-white">Home</Link><span>›</span><span className="text-[#b8aaff]">Anime</span></nav>
        <header className="rounded-[24px] border border-white/10 bg-gradient-to-br from-[#17152c] via-[#15132a] to-[#111021] p-5 shadow-[0_18px_50px_rgba(0,0,0,.22)] sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#a58cff]"><Sparkles size={13} /> Cinevero catalogue</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-5xl">Anime</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a7a2ba]">Popular anime movies and series, in the same Cinevero experience as Movies, Series and Discover.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#aaa5bc]">Page {page} of {Math.max(totalPages, 1)}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#7751ff]/10 px-3 py-2 text-[11px] font-bold text-[#b8aaff]"><SlidersHorizontal size={14} /> Popularity</span>
            <Link href="/movie" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-[#aaa5bc] hover:border-[#7751ff] hover:text-white">Movies</Link>
            <Link href="/series" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-[#aaa5bc] hover:border-[#7751ff] hover:text-white">Series</Link>
            <Link href="/discover" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-[#aaa5bc] hover:border-[#7751ff] hover:text-white">Discover</Link>
            <Link href="/genres" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-[#aaa5bc] hover:border-[#7751ff] hover:text-white">Genres</Link>
          </div>
        </header>

        <section className="mt-7 rounded-[20px] border border-white/10 bg-[#17162a] p-5"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#a58cff]">Cinevero anime guide</p><h2 className="mt-2 text-xl font-black">How to explore anime on Cinevero</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#aaa5bc]">This catalogue helps you compare anime movies and series by format, release year, popularity and rating. Open a title for its full details, seasons or related recommendations, then use the available provider information to check legitimate viewing options.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/5 p-3"><h3 className="text-xs font-black">Anime movies</h3><p className="mt-1 text-[11px] leading-5 text-[#8f8aa3]">Browse standalone stories and open each title for its full movie details.</p></div><div className="rounded-2xl bg-white/5 p-3"><h3 className="text-xs font-black">Anime series</h3><p className="mt-1 text-[11px] leading-5 text-[#8f8aa3]">Explore seasons, episodes, cast and series information from the detail page.</p></div><div className="rounded-2xl bg-white/5 p-3"><h3 className="text-xs font-black">Discovery</h3><p className="mt-1 text-[11px] leading-5 text-[#8f8aa3]">Use related titles and Cinevero's catalogue navigation to continue exploring.</p></div></div></section>\n\n        {items.length === 0 ? (
          <div className="mt-7 rounded-[20px] border border-dashed border-white/15 bg-white/[.03] px-6 py-16 text-center text-sm text-[#8f8aa3]">No anime titles are available on this page. Try another page.</div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
            {items.map((item: any, index: number) => {
              const isTv = item.media_type === 'tv';
              const title = titleOf(item); const year = dateOf(item).slice(0, 4); const rating = typeof item.vote_average === 'number' && item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A';
              return <Link key={`${item.media_type}-${item.id}`} href={hrefOf(item)} className="group min-w-0 rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58cff]">
                <article className="overflow-hidden rounded-[16px] border border-white/10 bg-[#17162a] shadow-[0_8px_24px_rgba(0,0,0,.16)] transition duration-200 group-hover:-translate-y-1 group-hover:border-white/20 group-hover:shadow-[0_14px_32px_rgba(0,0,0,.25)]">
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#211f39]">
                    {item.poster_path ? <img src={tmdbImage(item.poster_path, index < 6 ? 'w342' : 'w342')} alt={`${title} poster`} loading={index < 6 ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" /> : <div className="flex h-full items-center justify-center p-3 text-center text-xs text-[#77728c]">No poster</div>}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#17162a] to-transparent" />
                    <span className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white backdrop-blur">{isTv ? 'Series' : 'Movie'}</span>
                    {rating !== 'N/A' && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold text-white backdrop-blur"><Star size={10} fill="currentColor" className="text-amber-300" /> {rating}</span>}
                  </div>
                  <div className="p-2.5"><h2 className="line-clamp-2 min-h-9 text-xs font-extrabold leading-4 text-white group-hover:text-[#b8aaff]">{title}</h2><p className="mt-1 text-[10px] font-semibold text-[#817d99]">{year || '—'} <span className="mx-1">•</span> {isTv ? 'Anime Series' : 'Anime Movie'}</p></div>
                </article>
              </Link>;
            })}
          </div>
        )}

        <nav className="mt-9 flex items-center justify-center gap-2" aria-label="Anime pagination">
          <Link href={page > 1 ? `/anime?page=${page - 1}` : '/anime'} aria-disabled={page <= 1} className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold ${page <= 1 ? 'pointer-events-none opacity-35' : 'hover:border-[#7751ff] hover:text-white'}`}><ArrowLeft size={14} /> Previous</Link>
          <span className="rounded-xl bg-[#7751ff]/10 px-4 py-2.5 text-xs font-black text-[#b8aaff]">{page} / {Math.max(totalPages, 1)}</span>
          <Link href={page < totalPages ? `/anime?page=${page + 1}` : `/anime?page=${Math.max(totalPages,1)}`} aria-disabled={page >= totalPages} className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold ${page >= totalPages ? 'pointer-events-none opacity-35' : 'hover:border-[#7751ff] hover:text-white'}`}>Next <ArrowRight size={14} /></Link>
        </nav>
      </div>
    </main>
  );
}
