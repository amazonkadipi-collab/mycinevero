'use client';

import Link from 'next/link';
import { ArrowRight, Bell, Bookmark, ChevronLeft, CircleUserRound, Compass, Download, Home, Play, Search, Star } from 'lucide-react';
import type { TmdbTitle } from '@/lib/tmdb';
import { tmdbImage } from '@/lib/tmdb';

type Props = { trending: TmdbTitle[]; popularMovies: TmdbTitle[]; popularSeries: TmdbTitle[]; latestMovies: TmdbTitle[]; upcoming: TmdbTitle[]; anime: TmdbTitle[] };
const genreLinks = [['action','Action'],['comedy','Comedy'],['crime','Crime'],['drama','Drama'],['horror','Horror'],['mystery','Mystery'],['romance','Romance'],['science-fiction','Sci-Fi'],['thriller','Thriller']];
function titleOf(item: TmdbTitle) { return item.title || item.name || item.original_title || item.original_name || 'Untitled'; }
function yearOf(item: TmdbTitle) { return (item.release_date || item.first_air_date || '').slice(0,4); }
function ratingOf(item: TmdbTitle) { return typeof item.vote_average === 'number' && item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A'; }
function slug(value: string, id: number) { return `${value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${id}`; }

function PosterCard({ item, wide = false }: { item: TmdbTitle; wide?: boolean }) {
  const type = item.media_type === 'tv' || item.name ? 'series' : 'movie';
  const title = titleOf(item);
  return <Link href={`/${type}/${slug(title, item.id)}`} className={`group block shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 ${wide ? 'w-[210px] sm:w-[240px]' : 'w-[132px] sm:w-[160px]'}`}>
    <article className="overflow-hidden rounded-[14px] bg-[#211f39] shadow-[0_8px_22px_rgba(0,0,0,.16)]">
      <div className={`relative overflow-hidden bg-[#252140] ${wide ? 'aspect-[16/9]' : 'aspect-[2/3]'}`}>
        {item.poster_path || item.backdrop_path ? <img src={tmdbImage(wide ? item.backdrop_path : item.poster_path, wide ? 'w780' : 'w342')} alt={`${title} poster`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-[#9793ad]">No artwork</div>}
        {!wide && <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur"><Star size={10} fill="currentColor" className="text-amber-300" /> {ratingOf(item)}</span>}
        {wide && <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold text-white backdrop-blur"><Play size={10} fill="currentColor" /> Watch trailer</span>}
      </div>
      <div className="px-2.5 py-2.5"><p className="truncate text-[12px] font-extrabold text-white group-hover:text-[#a58cff]">{title}</p><p className="mt-1 text-[10px] font-semibold text-[#9390a6]">{yearOf(item) || '2024'} <span className="mx-1 text-[#56526f]">•</span>{type === 'movie' ? 'Movie' : 'Series'}</p></div>
    </article>
  </Link>;
}

function Rail({ title, items, href, icon, wide = false }: { title: string; items: TmdbTitle[]; href: string; icon: string; wide?: boolean }) {
  return <section className="mt-7"><div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-[17px] font-black tracking-tight text-white"><span>{icon}</span>{title}</h2><Link href={href} className="flex items-center gap-1 text-[11px] font-bold text-[#a99aff] hover:text-white">View all <ArrowRight size={13} /></Link></div><div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{items.slice(0, 12).map(item => <PosterCard key={`${item.id}-${item.media_type || item.name}`} item={item} wide={wide} />)}</div></section>;
}

export default function CatalogHome({ trending, popularMovies, popularSeries, latestMovies, upcoming, anime }: Props) {
  const featured = trending[0] || popularMovies[0];
  const featuredType = featured?.media_type === 'tv' || featured?.name ? 'series' : 'movie';
  const featuredHref = featured ? `/${featuredType}/${slug(titleOf(featured), featured.id)}` : '/movie';
  const continueWatching = trending.slice(1, 5).length ? trending.slice(1, 5) : popularMovies.slice(0, 4);
  return <div className="min-h-screen overflow-x-hidden bg-[#0e0e1d] pb-20 text-white sm:pb-8">
    <main className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
      <section className="relative -mx-4 min-h-[475px] overflow-hidden sm:mx-0 sm:mt-5 sm:min-h-[520px] sm:rounded-[28px]">
        {featured?.backdrop_path && <img src={tmdbImage(featured.backdrop_path, 'original')} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-70" />}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(116,74,255,.3),transparent_35%),linear-gradient(180deg,rgba(14,14,29,.12)_0%,#0e0e1d_92%)]" />
        <div className="relative flex min-h-[475px] flex-col justify-end px-5 pb-7 sm:min-h-[520px] sm:px-9 sm:pb-10">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-[#b8aaff]"><span className="h-1.5 w-1.5 rounded-full bg-[#8d68ff] shadow-[0_0_12px_#8d68ff]" /> Trending for you</div>
          <h1 className="max-w-[520px] text-[38px] font-black leading-[.98] tracking-[-.06em] sm:text-6xl">Your next<br /><span className="text-[#a58cff]">favorite story.</span></h1>
          <p className="mt-4 max-w-[430px] text-[13px] leading-5 text-[#d0cddd] sm:text-sm">Discover movies, series and anime made for your mood. Find something worth watching tonight.</p>
          {featured && <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#e6e3ef]"><span>{titleOf(featured)}</span><span className="text-[#6c6882]">•</span><span>{yearOf(featured) || '2024'}</span><span className="flex items-center gap-1 text-amber-300"><Star size={11} fill="currentColor" /> {ratingOf(featured)}</span></div>}
          <div className="mt-5 flex gap-2.5"><Link href={featuredHref} className="flex items-center gap-2 rounded-xl bg-[#7751ff] px-5 py-3 text-xs font-black shadow-[0_8px_24px_rgba(119,81,255,.3)] hover:bg-[#8d68ff] active:scale-95"><Play size={14} fill="currentColor" /> Play now</Link><Link href="/discover" className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black backdrop-blur hover:bg-white/15 active:scale-95">Discover</Link></div>
        </div>
      </section>

      <section className="-mx-4 mt-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex min-w-max gap-2">{genreLinks.map(([slugValue, name]) => <Link key={slugValue} href={`/genre/${slugValue}`} className="rounded-full border border-white/10 bg-[#17162a] px-3.5 py-2 text-[11px] font-bold text-[#aaa6b9] hover:border-[#7751ff] hover:text-white">{name}</Link>)}<Link href="/anime" className="rounded-full border border-[#7751ff]/40 bg-[#7751ff]/10 px-3.5 py-2 text-[11px] font-black text-[#b8aaff] hover:bg-[#7751ff]/20">Anime</Link></div></section>
      <Rail title="Continue watching" items={continueWatching} href="/search" icon="▶" wide />
      <Rail title="Trending now" items={trending} href="/search" icon="🔥" />
      <Rail title="Popular movies" items={popularMovies} href="/movie" icon="🍿" />
      <Rail title="Popular series" items={popularSeries} href="/series" icon="📺" />
      {anime.length > 0 && <Rail title="Popular anime" items={anime} href="/anime" icon="🎌" />}
      <Rail title="Coming soon" items={upcoming.length ? upcoming : latestMovies} href="/movie" icon="✨" />
    </main>
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#121122]/95 px-4 py-2.5 backdrop-blur-xl sm:hidden"><div className="mx-auto flex max-w-md items-center justify-around"><Link href="/" className="flex flex-col items-center gap-1 text-[#9d83ff]"><Home size={19} fill="currentColor" /><span className="text-[9px] font-bold">Home</span></Link><Link href="/discover" className="flex flex-col items-center gap-1 text-[#858198] hover:text-white"><Compass size={19} /><span className="text-[9px] font-bold">Discover</span></Link><Link href="/anime" className="flex flex-col items-center gap-1 text-[#858198] hover:text-white"><span className="text-[18px] leading-[19px]">🎌</span><span className="text-[9px] font-bold">Anime</span></Link><Link href="/search" className="flex flex-col items-center gap-1 text-[#858198] hover:text-white"><Search size={19} /><span className="text-[9px] font-bold">Search</span></Link><Link href="/profile" className="flex flex-col items-center gap-1 text-[#858198] hover:text-white"><CircleUserRound size={19} /><span className="text-[9px] font-bold">Profile</span></Link></div></nav>
  </div>;
}
