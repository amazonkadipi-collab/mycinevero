'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';

type Props = { initialSearch?: string; initialPage?: number; initialOrder?: string; initialVideos?: unknown[]; initialTotalPages?: number; initialError?: string };

export default function VideoPortalClient({ initialSearch = '' }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [searchOpen, setSearchOpen] = useState(false);
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); };
  return <div className="min-h-screen bg-[#f7f7f8] text-[#202124]">
    <header className="border-b border-[#e5e5e7] bg-white">
      <div className="mx-auto flex min-h-[62px] max-w-[1180px] items-center gap-5 px-4 sm:px-6">
        <button type="button" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)} className="rounded-md p-2 text-[#4b4d52] hover:bg-[#f1f1f3] md:hidden">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        <Link href="/" className="shrink-0 text-[22px] font-extrabold tracking-[-0.08em]"><span className="text-[#191a1d]">ELO</span><span className="text-[#e3263f]">VEX</span></Link>
        <form onSubmit={submitSearch} className="hidden min-w-0 flex-1 md:flex md:max-w-[440px]"><div className="flex w-full items-center border border-[#d7d7da] bg-[#fafafa] px-3 focus-within:border-[#e3263f]"><Search size={16} className="shrink-0 text-[#85878d]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" aria-label="Search" className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-[#92949a]" /></div><button type="submit" className="bg-[#e3263f] px-4 text-sm font-semibold text-white hover:bg-[#c91d34]">Search</button></form>
        <nav className="ml-auto hidden items-center gap-5 text-[14px] font-medium md:flex"><Link className="text-[#26272a] hover:text-[#e3263f]" href="/">Home</Link><Link className="text-[#55575d] hover:text-[#e3263f]" href="/">Movies</Link><Link className="text-[#55575d] hover:text-[#e3263f]" href="/">Series</Link></nav>
        <button type="button" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)} className="ml-auto rounded-md p-2 text-[#55575d] hover:bg-[#f1f1f3] md:hidden"><Search size={20} /></button>
      </div>
      {menuOpen && <nav className="border-t border-[#e5e5e7] bg-white px-5 py-3 md:hidden"><div className="mx-auto flex max-w-[1180px] gap-5 text-sm font-medium"><Link href="/">Home</Link><Link href="/">Movies</Link><Link href="/">Series</Link></div></nav>}
      {searchOpen && <form onSubmit={submitSearch} className="border-t border-[#e5e5e7] bg-white p-3 md:hidden"><div className="mx-auto flex max-w-[1180px]"><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search movies or series" className="min-w-0 flex-1 border border-[#d7d7da] px-3 py-2 text-sm outline-none focus:border-[#e3263f]" /><button className="bg-[#e3263f] px-4 text-sm font-semibold text-white">Search</button></div></form>}
    </header>
    <main className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-6">
      <section className="border-b border-[#dedee1] py-8 sm:py-10"><h1 className="text-[26px] font-bold tracking-[-0.03em] sm:text-[32px]">Elovex: Movies and Series Streaming</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6d73]">Find your favorite movies and series in a fast, clean interface built for every screen.</p></section>
      <section className="grid gap-6 py-7 sm:grid-cols-2"><div className="border border-[#e1e1e4] bg-white p-5"><h2 className="mb-4 border-b border-[#e9e9eb] pb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#44464b]">New Episodes</h2><div className="space-y-3"><div className="h-4 w-4/5 animate-pulse bg-[#eeeeF0]" /><div className="h-4 w-3/5 animate-pulse bg-[#eeeeF0]" /><div className="h-4 w-2/3 animate-pulse bg-[#eeeeF0]" /></div><p className="mt-5 text-xs text-[#999ba0]">Your catalogue will appear here.</p></div><div className="border border-[#e1e1e4] bg-white p-5"><h2 className="mb-4 border-b border-[#e9e9eb] pb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#44464b]">New Seasons</h2><div className="space-y-3"><div className="h-4 w-3/4 animate-pulse bg-[#eeeeF0]" /><div className="h-4 w-1/2 animate-pulse bg-[#eeeeF0]" /><div className="h-4 w-4/5 animate-pulse bg-[#eeeeF0]" /></div><p className="mt-5 text-xs text-[#999ba0]">New releases will connect to your API.</p></div></section>
      <section className="border border-[#e1e1e4] bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between border-b border-[#e9e9eb] pb-3"><h2 className="text-[18px] font-bold">Movies and Series</h2><span className="text-xs text-[#999ba0]">Design preview</span></div><div className="flex min-h-[210px] items-center justify-center border border-dashed border-[#d8d8dc] bg-[#fbfbfc] px-5 text-center"><div><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f0f2] text-[#a1a3a8]"><Search size={20} /></div><p className="text-sm font-semibold text-[#55575d]">Catalogue is empty for now</p><p className="mt-1 text-xs text-[#97999e]">Movies will appear when your API is connected.</p></div></div></section>
    </main>
    <footer className="border-t border-[#e5e5e7] bg-white"><div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-4 py-6 text-xs text-[#85878d] sm:flex-row sm:items-center sm:justify-between sm:px-6"><span>© {new Date().getFullYear()} Elovex</span><div className="flex gap-4"><Link href="/contact" className="hover:text-[#e3263f]">Contact</Link><Link href="/privacy-policy" className="hover:text-[#e3263f]">Privacy</Link></div></div></footer>
  </div>;
}
