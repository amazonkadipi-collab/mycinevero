'use client';

import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import type { TmdbTitle } from '@/lib/tmdb';
import { tmdbImage } from '@/lib/tmdb';
import SiteHeader from '@/components/SiteHeader';

type Props = { trending: TmdbTitle[]; popularMovies: TmdbTitle[]; popularSeries: TmdbTitle[]; latestMovies: TmdbTitle[]; upcoming: TmdbTitle[] };
const genreLinks = [['action','Action'],['comedy','Comedy'],['crime','Crime'],['drama','Drama'],['horror','Horror'],['mystery','Mystery'],['romance','Romance'],['science-fiction','Sci-Fi'],['thriller','Thriller']];
function titleOf(item: TmdbTitle) { return item.title || item.name || item.original_title || item.original_name || 'Untitled'; }
function yearOf(item: TmdbTitle) { return (item.release_date || item.first_air_date || '').slice(0,4); }
function ratingOf(item: TmdbTitle) { return typeof item.vote_average === 'number' && item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A'; }
function Card({ item }: { item: TmdbTitle }) {
  const type = item.media_type === 'tv' || item.name ? 'series' : 'movie';
  const title = titleOf(item);
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${item.id}`;
  const rating = ratingOf(item);
  return <Link href={`/${type}/${slug}`} className="group block min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-zinc-300 group-hover:shadow-lg">
      <div className="aspect-[2/3] bg-zinc-100">{item.poster_path ? <img src={tmdbImage(item.poster_path,'w342')} alt={`${title} poster`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-xs text-zinc-400">No poster</div>}</div>
      <div className="p-3"><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold"><span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">{type === 'movie' ? 'Movie' : 'Series'}</span>{yearOf(item) && <span className="text-zinc-500">{yearOf(item)}</span>}</div><h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 group-hover:text-red-600">{title}</h3><div className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500" aria-label={`Rating ${rating === 'N/A' ? 'not available' : `${rating} out of 10`}`}><Star size={12} fill="currentColor" aria-hidden="true" />{rating === 'N/A' ? 'Not rated' : `${rating}/10`}</div></div>
    </article>
  </Link>;
}
function Section({ title, items, href }: { title:string; items:TmdbTitle[]; href:string }) {
  return <section className="border-t border-zinc-200 py-9 sm:py-11"><div className="mb-5 flex items-end justify-between gap-4"><h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2><Link href={href} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">View all <ArrowRight size={14} aria-hidden="true" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">{items.slice(0,8).map(item => <Card key={`${item.media_type || (item.name ? 'tv':'movie')}-${item.id}`} item={item}/>)}</div></section>;
}
export default function CatalogHome({ trending, popularMovies, popularSeries, latestMovies, upcoming }: Props) {
  const featured = trending[0] || popularMovies[0];
  return <div className="min-h-screen bg-white text-zinc-900"><SiteHeader /><main className="mx-auto max-w-[1180px] px-4 sm:px-6">
    <section className="relative mt-5 min-h-[440px] overflow-hidden rounded-2xl bg-zinc-950 text-white sm:mt-7">
      {featured?.backdrop_path && <img src={tmdbImage(featured.backdrop_path,'w1280')} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-55" />}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/25" />
      <div className="relative flex min-h-[440px] max-w-2xl flex-col justify-end p-6 sm:p-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-red-400">CINEVERO · MOVIES & SERIES</p>
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Find what to watch next.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">Explore trending movies, TV series, genres, ratings and official trailers in one clean discovery catalogue.</p>
        {featured && <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-zinc-300"><span className="rounded-full bg-white/10 px-3 py-1.5">Featured: {titleOf(featured)}</span>{yearOf(featured) && <span>{yearOf(featured)}</span>}{ratingOf(featured) !== 'N/A' && <span>★ {ratingOf(featured)}/10</span>}</div>}
        <div className="mt-7 flex flex-wrap gap-3"><Link href={featured ? `/${featured.media_type === 'tv' || featured.name ? 'series' : 'movie'}/${titleOf(featured).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${featured.id}` : '/movie'} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700">View details</Link><Link href="/movie" className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Browse movies</Link></div>
      </div>
    </section>
    <section className="py-7 sm:py-8"><div className="flex gap-2 overflow-x-auto pb-1" aria-label="Popular genres">{genreLinks.map(([slug,name])=><Link key={slug} href={`/genre/${slug}`} className="shrink-0 rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:border-red-500 hover:text-red-600">{name}</Link>)}<Link href="/genres" className="shrink-0 rounded-full bg-zinc-900 px-3 py-2 text-xs font-semibold text-white">All genres</Link></div></section>
    <Section title="Trending now" items={trending} href="/search" />
    <Section title="Popular movies" items={popularMovies} href="/movie" />
    <Section title="Popular series" items={popularSeries} href="/series" />
    <Section title="Coming soon" items={upcoming.length ? upcoming : latestMovies} href="/movie" />
  </main></div>;
}
