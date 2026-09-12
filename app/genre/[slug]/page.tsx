import type { Metadata } from 'next';
import Link from 'next/link';
import { slugify, tmdbDiscover, tmdbImage, type TmdbTitle } from '@/lib/tmdb';
import { notFound } from 'next/navigation';

const GENRES: Record<string, { name: string; movie: number; tv: number }> = {
  action: { name: 'Action', movie: 28, tv: 10759 }, adventure: { name: 'Adventure', movie: 12, tv: 10759 },
  animation: { name: 'Animation', movie: 16, tv: 16 }, comedy: { name: 'Comedy', movie: 35, tv: 35 },
  crime: { name: 'Crime', movie: 80, tv: 80 }, documentary: { name: 'Documentary', movie: 99, tv: 99 },
  drama: { name: 'Drama', movie: 18, tv: 18 }, family: { name: 'Family', movie: 10751, tv: 10751 },
  fantasy: { name: 'Fantasy', movie: 14, tv: 10765 }, horror: { name: 'Horror', movie: 27, tv: 0 },
  mystery: { name: 'Mystery', movie: 9648, tv: 9648 }, romance: { name: 'Romance', movie: 10749, tv: 0 },
  'science-fiction': { name: 'Science Fiction', movie: 878, tv: 10765 }, thriller: { name: 'Thriller', movie: 53, tv: 0 },
  western: { name: 'Western', movie: 37, tv: 0 },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://watchmovies4.vercel.app';

export function generateStaticParams() { return Object.keys(GENRES).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const genre = GENRES[slug];
  if (!genre) return { title: 'Genre not found', robots: { index: false } };
  return { title: `${genre.name} Movies & Series`, description: `Browse popular ${genre.name.toLowerCase()} movies and TV series on Watch Movies 4.`, alternates: { canonical: `${SITE_URL}/genre/${slug}` }, openGraph: { title: `${genre.name} Movies & Series | Watch Movies 4`, description: `Browse popular ${genre.name.toLowerCase()} movies and TV series on Watch Movies 4.`, url: `${SITE_URL}/genre/${slug}`, siteName: 'Watch Movies 4', type: 'website' } };
}

function Card({ item, type }: { item: TmdbTitle; type: 'movie' | 'tv' }) {
  const title = type === 'tv' ? item.name || item.original_name : item.title || item.original_title;
  const date = type === 'tv' ? item.first_air_date : item.release_date;
  if (!title) return null;
  return <Link href={`/${type === 'tv' ? 'series' : 'movie'}/${slugify(title)}-${item.id}`} className="group"><div className="aspect-[2/3] bg-zinc-100">{item.poster_path && <img src={tmdbImage(item.poster_path, 'w342')} alt={title} className="h-full w-full object-cover" loading="lazy" />}</div><h2 className="mt-2 line-clamp-2 text-sm font-semibold group-hover:text-red-600">{title}</h2><p className="mt-1 text-xs text-zinc-500">{(date || '').slice(0, 4)}{item.vote_average ? ` · ${item.vote_average.toFixed(1)}/10` : ''}</p></Link>;
}

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const genre = GENRES[slug]; if (!genre) notFound();
  const [movies, series] = await Promise.all([
    tmdbDiscover('movie', 1, genre.movie).catch(() => ({ results: [] as TmdbTitle[], total_pages: 0 })),
    genre.tv ? tmdbDiscover('tv', 1, genre.tv).catch(() => ({ results: [] as TmdbTitle[], total_pages: 0 })) : Promise.resolve({ results: [] as TmdbTitle[], total_pages: 0 }),
  ]);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${genre.name} Movies & Series`, url: `${SITE_URL}/genre/${slug}`, description: `Browse popular ${genre.name.toLowerCase()} movies and TV series on Watch Movies 4.` };
  return <main className="min-h-screen bg-white text-zinc-900"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><header className="border-b border-zinc-200"><div className="mx-auto flex max-w-[1180px] items-center gap-6 px-4 py-5 sm:px-6"><Link href="/" className="text-xl font-black">WATCH <span className="text-red-600">MOVIES</span> 4</Link><Link href="/genres" className="ml-auto text-sm font-semibold text-zinc-600 hover:text-red-600">Genres</Link></div></header><section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6"><nav className="text-sm text-zinc-500"><Link href="/" className="hover:text-red-600">Home</Link> / <Link href="/genres" className="hover:text-red-600">Genres</Link> / <span>{genre.name}</span></nav><h1 className="mt-5 text-4xl font-bold tracking-tight">{genre.name} Movies & Series</h1><p className="mt-3 max-w-2xl text-zinc-600">Browse popular {genre.name.toLowerCase()} titles and discover movies and series worth exploring.</p><h2 className="mt-10 text-2xl font-bold">{genre.name} Movies</h2><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{movies.results.slice(0, 18).map((item) => <Card key={item.id} item={item} type="movie" />)}</div><h2 className="mt-12 text-2xl font-bold">{genre.name} Series</h2><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{series.results.slice(0, 18).map((item) => <Card key={item.id} item={item} type="tv" />)}</div></section></main>;
}
