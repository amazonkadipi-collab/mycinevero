'use client';

import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/discover', label: 'Discover' },
  { href: '/movie', label: 'Movies' },
  { href: '/series', label: 'Series' },
  { href: '/genres', label: 'Genres' },
];

export default function SiteHeader({ dark = false }: { dark?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => { const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)}; document.addEventListener('keydown',onKeyDown); return()=>document.removeEventListener('keydown',onKeyDown); },[]);
  useEffect(() => { document.body.style.overflow=open?'hidden':''; return()=>{document.body.style.overflow=''}; },[open]);
  const submit=(event:FormEvent)=>{event.preventDefault();const q=query.trim();if(q)window.location.href=`/search?q=${encodeURIComponent(q)}`};
  const isActive=(href:string)=>href==='/'?pathname==='/':pathname===href||pathname.startsWith(`${href}/`);
  const surface=dark?'border-white/10 bg-slate-950/90 text-white':'border-sky-100/90 bg-white/90 text-slate-900';
  const hover=dark?'hover:bg-white/10 hover:text-white':'hover:bg-sky-50 hover:text-cyan-700';
  return <header className={`sticky top-0 z-50 border-b shadow-[0_2px_16px_rgba(23,32,51,0.05)] backdrop-blur-xl ${surface}`}><div className="mx-auto flex min-h-14 max-w-[1180px] items-center gap-2.5 px-3 sm:px-5">
    <button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls="cinevero-mobile-nav" aria-label={open?'Close navigation menu':'Open navigation menu'} className={`order-first rounded-xl p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 md:hidden ${hover}`}>{open?<X size={19} aria-hidden="true"/>:<Menu size={19} aria-hidden="true"/>}</button>
    <Link href="/" aria-label="Cinevero home" className="shrink-0 text-[21px] font-black tracking-[-0.075em] sm:text-[23px]">CINE<span className={dark?'text-orange-300':'text-orange-500'}>VERO</span><span className="ml-1 text-[10px] align-top font-extrabold tracking-normal text-cyan-600">✦</span></Link>
    <form onSubmit={submit} role="search" className="ml-2 hidden max-w-[410px] flex-1 md:flex"><label className="sr-only" htmlFor="site-search">Search movies and series</label><div className={`flex w-full overflow-hidden rounded-2xl border ${dark?'border-white/15 bg-white/5 focus-within:border-orange-300':'border-sky-100 bg-sky-50/70 focus-within:border-cyan-400 focus-within:bg-white'} focus-within:ring-2 focus-within:ring-cyan-400/10`}><input id="site-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search movies & series" className={`min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none ${dark?'placeholder:text-slate-500':'placeholder:text-slate-400'}`}/><button type="submit" aria-label="Search" className="bg-orange-500 px-3.5 text-white hover:bg-orange-600"><Search size={15} aria-hidden="true"/></button></div></form>
    <nav aria-label="Primary navigation" className="ml-auto hidden items-center gap-0.5 text-[13px] font-bold md:flex">{links.map(link=><Link key={link.href} href={link.href} aria-current={isActive(link.href)?'page':undefined} className={`rounded-xl px-2.5 py-1.5 ${isActive(link.href)?(dark?'bg-white/10 text-orange-300':'bg-orange-50 text-orange-600 shadow-sm'):(dark?'text-slate-300':'text-slate-600')} ${hover}`}>{link.label}</Link>)}</nav>
    <Link href="/search" aria-label="Search movies and series" className={`ml-auto rounded-xl p-2 md:hidden ${hover}`}><Search size={19} aria-hidden="true"/></Link>
  </div>{open&&<div id="cinevero-mobile-nav" className={`border-t px-3 py-2 md:hidden ${dark?'border-white/10 bg-slate-950':'border-sky-100 bg-white/95'}`}><nav aria-label="Mobile navigation" className="mx-auto grid max-w-[1180px] gap-1 text-sm font-bold">{links.map(link=><Link key={link.href} onClick={()=>setOpen(false)} href={link.href} aria-current={isActive(link.href)?'page':undefined} className={`rounded-xl px-3 py-2.5 ${isActive(link.href)?(dark?'bg-white/10 text-orange-300':'bg-orange-50 text-orange-600'):hover}`}>{link.label}</Link>)}<Link onClick={()=>setOpen(false)} href="/search" className={`rounded-xl px-3 py-2.5 ${hover}`}>Search</Link></nav></div>}</header>;
}
