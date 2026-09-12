'use client';

import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/movie', label: 'Movies' },
  { href: '/series', label: 'Series' },
  { href: '/genres', label: 'Genres' },
];

export default function SiteHeader({ dark = false }: { dark?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  const surface = dark ? 'border-white/10 bg-zinc-950/90 text-white' : 'border-zinc-200 bg-white/95 text-zinc-900';
  const hover = dark ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-zinc-100 hover:text-red-600';

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur ${surface}`}>
      <div className="mx-auto flex min-h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6">
        <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls="cinevero-mobile-nav" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} className={`order-first rounded-lg p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 md:hidden ${hover}`}>
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
        <Link href="/" aria-label="Cinevero home" className="shrink-0 text-[22px] font-black tracking-[-0.07em] sm:text-[24px]">
          CINE<span className={dark ? 'text-red-400' : 'text-red-600'}>VERO</span>
        </Link>
        <form onSubmit={submit} role="search" className="ml-3 hidden max-w-[430px] flex-1 md:flex">
          <label className="sr-only" htmlFor="site-search">Search movies and series</label>
          <div className={`flex w-full overflow-hidden rounded-xl border ${dark ? 'border-white/15 bg-white/5 focus-within:border-red-400' : 'border-zinc-300 bg-white focus-within:border-red-500'} focus-within:ring-2 focus-within:ring-red-500/10`}>
            <input id="site-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search movies and series" className={`min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none ${dark ? 'placeholder:text-zinc-500' : 'placeholder:text-zinc-400'}`} />
            <button type="submit" aria-label="Search" className="bg-red-600 px-4 text-white hover:bg-red-700"><Search size={16} aria-hidden="true" /></button>
          </div>
        </form>
        <nav aria-label="Primary navigation" className="ml-auto hidden items-center gap-1 text-sm font-semibold md:flex">
          {links.map(link => isActive(link.href) ? (
            <Link key={link.href} href={link.href} aria-current="page" className={`rounded-lg px-3 py-2 ${dark ? 'bg-white/10 text-red-400' : 'bg-zinc-100 text-red-600'}`}>{link.label}</Link>
          ) : (
            <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 ${dark ? 'text-zinc-300' : 'text-zinc-600'} ${hover}`}>{link.label}</Link>
          ))}
        </nav>
        <Link href="/search" aria-label="Search movies and series" className={`ml-auto rounded-lg p-2 md:hidden ${hover}`}><Search size={20} aria-hidden="true" /></Link>
      </div>
      {open && (
        <div id="cinevero-mobile-nav" className={`border-t px-4 py-3 md:hidden ${dark ? 'border-white/10 bg-zinc-950' : 'border-zinc-200 bg-white'}`}>
          <nav aria-label="Mobile navigation" className="mx-auto grid max-w-[1180px] gap-1 text-sm font-semibold">
            {links.map(link => <Link key={link.href} onClick={() => setOpen(false)} href={link.href} aria-current={isActive(link.href) ? 'page' : undefined} className={`rounded-lg px-3 py-3 ${isActive(link.href) ? (dark ? 'bg-white/10 text-red-400' : 'bg-zinc-100 text-red-600') : hover}`}>{link.label}</Link>)}
            <Link onClick={() => setOpen(false)} href="/search" className={`rounded-lg px-3 py-3 ${hover}`}>Search</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
