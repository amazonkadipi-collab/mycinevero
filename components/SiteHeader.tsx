'use client';

import Link from 'next/link';
import { Menu, Search, X, Bell } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const links = [{ href: '/', label: 'Home' }, { href: '/discover', label: 'Discover' }, { href: '/movie', label: 'Movies' }, { href: '/series', label: 'Series' }, { href: '/genres', label: 'Genres' }];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); }; document.addEventListener('keydown', onKeyDown); return () => document.removeEventListener('keydown', onKeyDown); }, []);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  const submit = (event: FormEvent) => { event.preventDefault(); const q = query.trim(); if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`; };
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  return <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0e0e1d]/90 text-white shadow-[0_3px_18px_rgba(0,0,0,.16)] backdrop-blur-xl"><div className="mx-auto flex min-h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6 lg:px-8">
    <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} className="rounded-xl p-2 text-[#aaa6b9] hover:bg-white/10 hover:text-white md:hidden">{open ? <X size={20} /> : <Menu size={20} />}</button>
    <Link href="/" aria-label="Cinevero home" className="shrink-0 text-[22px] font-black tracking-[-.08em]">CINE<span className="text-[#9d83ff]">VERO</span><span className="ml-1 text-[10px] align-top text-[#9d83ff]">✦</span></Link>
    <form onSubmit={submit} role="search" className="ml-5 hidden max-w-[330px] flex-1 md:flex"><label className="sr-only" htmlFor="site-search">Search movies and series</label><div className="flex w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 focus-within:border-[#7751ff]"><input id="site-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search movies & series" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-[#757187]" /><button type="submit" aria-label="Search" className="px-3.5 text-[#aaa0ff] hover:bg-[#7751ff] hover:text-white"><Search size={16} /></button></div></form>
    <nav aria-label="Primary navigation" className="ml-auto hidden items-center gap-1 text-[13px] font-bold md:flex">{links.map(link => <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? 'page' : undefined} className={`rounded-xl px-3 py-2 ${isActive(link.href) ? 'bg-[#7751ff]/20 text-[#b8aaff]' : 'text-[#aaa6b9] hover:bg-white/10 hover:text-white'}`}>{link.label}</Link>)}</nav>
    <Link href="/search" aria-label="Search" className="ml-auto rounded-xl p-2 text-[#aaa6b9] hover:bg-white/10 hover:text-white md:hidden"><Search size={19} /></Link><Link href="/notifications" aria-label="Notifications" className="hidden rounded-xl p-2 text-[#aaa6b9] hover:bg-white/10 hover:text-white sm:block"><Bell size={18} /></Link>
  </div>{open && <div id="cinevero-mobile-nav" className="border-t border-white/10 bg-[#121122] px-4 py-3 md:hidden"><nav className="grid gap-1 text-sm font-bold">{links.map(link => <Link key={link.href} onClick={() => setOpen(false)} href={link.href} aria-current={isActive(link.href) ? 'page' : undefined} className={`rounded-xl px-3 py-3 ${isActive(link.href) ? 'bg-[#7751ff]/20 text-[#b8aaff]' : 'text-[#aaa6b9] hover:bg-white/10 hover:text-white'}`}>{link.label}</Link>)}<Link onClick={() => setOpen(false)} href="/search" className="rounded-xl px-3 py-3 text-[#aaa6b9] hover:bg-white/10 hover:text-white">Search</Link></nav></div>}</header>;
}
