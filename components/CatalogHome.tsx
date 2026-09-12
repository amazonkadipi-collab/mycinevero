'use client';

import Link from 'next/link';
import { Star, ArrowRight, Sparkles } from 'lucide-react';
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
  return <Link href={`/${type}/${slug}`} className="group block min-w-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400">
    <article className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_4px_16px_rgba(23,32,51,0.06)] transition duration-200 group-hover:-translate-y-1 group-hover:border-cyan-200 group-hover:shadow-[0_10px_24px_rgba(22,138,173,0.13)]">
      <div className="relative aspect-[2/3] overflow-hidden bg-sky-50">{item.poster_path ? <img src={tmdbImage(item.poster_path,'w342')} alt={`${title} poster`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.035]" /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">No poster</div>}<span className="absolute left-2 top-2 rounded-full bg-white/92 px-2 py-1 text-[10px] font-extrabold text-cyan-700 shadow-sm backdrop-blur">{type === 'movie' ? 'MOVIE' : 'SERIES'}</span></div>
      <div className="p-2.5"><div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold"><span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-orange-600">{rating === 'N/A' ? 'NEW' : `★ ${rating}`}</span>{yearOf(item) && <span className="text-slate-400">{yearOf(item)}</span>}</div><h3 className="line-clamp-2 min-h-9 text-[13px] font-extrabold leading-[1.25rem] text-slate-800 group-hover:text-cyan-700">{title}</h3></div>
    </article>
  </Link>;
}
function Section({ title, items, href, emoji }: { title:string; items:TmdbTitle[]; href:string; emoji:string }) {
  return <section className="border-t border-sky-100/90 py-5 sm:py-6"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-[18px] font-black tracking-tight text-slate-800 sm:text-xl"><span aria-hidden="true">{emoji}</span>{title}</h2><Link href={href} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-cyan-700 shadow-sm ring-1 ring-sky-100 hover:bg-sky-50">View all <ArrowRight size={13} aria-hidden="true" /></Link></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-6 xl:grid-cols-7">{items.slice(0,8).map(item => <Card key={`${item.media_type || (item.name ? 'tv':'movie')}-${item.id}`} item={item}/>)}</div></section>;
}
export default function CatalogHome({ trending, popularMovies, popularSeries, latestMovies, upcoming }: Props) {
  const featured = trending[0] || popularMovies[0];
  const featuredType = featured?.media_type === 'tv' || featured?.name ? 'series' : 'movie';
  const featuredSlug = featured ? `${titleOf(featured).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${featured.id}` : '';
  return <div className="min-h-screen text-slate-900"><SiteHeader /><main className="mx-auto max-w-[1180px] px-3 sm:px-5">
    <section className="relative mt-3 min-h-[330px] overflow-hidden rounded-[22px] bg-slate-950 text-white shadow-[0_12px_34px_rgba(23,32,51,0.14)] sm:mt-4 sm:min-h-[350px]">
      {featured?.backdrop_path && <img src={tmdbImage(featured.backdrop_path,'original')} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-60" />}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/25" />
      <div className="relative flex min-h-[330px] max-w-2xl flex-col justify-end p-5 sm:min-h-[350px] sm:p-7">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300"><Sparkles size={12} aria-hidden="true" /> CINEVERO · MOVIES & SERIES</p>
        <h1 className="max-w-xl text-3xl font-black tracking-tight sm:text-5xl">Find something you’ll love.</h1>
        <p className="mt-2.5 max-w-lg text-[13px] leading-5 text-slate-200 sm:text-sm">Discover movies and series by mood, time, genre and what you feel like watching right now.</p>
        {featured && <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-200"><span className="rounded-full bg-white/12 px-2.5 py-1.5 backdrop-blur">🐠 Featured · {titleOf(featured)}</span>{yearOf(featured) && <span>{yearOf(featured)}</span>}{ratingOf(featured) !== 'N/A' && <span>★ {ratingOf(featured)}/10</span>}</div>}
        <div className="mt-4 flex flex-wrap gap-2"><Link href={featured ? `/${featuredType}/${featuredSlug}` : '/movie'} className="rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600">View details</Link><Link href="/discover" className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white backdrop-blur hover:bg-white/15">✨ Discover for me</Link></div>
      </div>
    </section>
    <section className="py-4 sm:py-5"><div className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Popular genres">{genreLinks.map(([slug,name])=><Link key={slug} href={`/genre/${slug}`} className="shrink-0 rounded-full border border-sky-100 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm hover:border-cyan-300 hover:bg-sky-50 hover:text-cyan-700">{name}</Link>)}<Link href="/genres" className="shrink-0 rounded-full bg-cyan-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm hover:bg-cyan-700">All genres</Link></div></section>
    <Section title="Trending now" items={trending} href="/search" emoji="🔥" />
    <Section title="Popular movies" items={popularMovies} href="/movie" emoji="🍿" />
    <Section title="Popular series" items={popularSeries} href="/series" emoji="📺" />
    <Section title="Coming soon" items={upcoming.length ? upcoming : latestMovies} href="/movie" emoji="✨" />
  </main></div>;
}
