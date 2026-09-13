"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, Film, Globe2, ListFilter, Search, Send, Tv, WandSparkles } from "lucide-react";

const SITE_URL = "https://cinevero.vercel.app";

const keywords = [
  ["what movie should I watch", "USA", "Decision", "High"],
  ["what to watch tonight", "USA", "Decision", "High"],
  ["best movies to watch", "Worldwide", "Discovery", "High"],
  ["movies to watch when bored", "USA", "Mood", "High"],
  ["movies based on mood", "Worldwide", "Mood", "High"],
  ["best movies for a date night", "USA", "Context", "High"],
  ["best movies for family night", "USA", "Context", "High"],
  ["best movies under 2 hours", "USA", "Time", "Medium"],
  ["best thriller movies to watch", "Worldwide", "Genre", "High"],
  ["best comedy movies to watch", "Worldwide", "Genre", "High"],
  ["what movie should I watch tonight", "USA", "Decision", "High"],
];

const countries = ["All", "USA", "Worldwide", "India", "UK", "Canada"];

export default function KeywordResearchPage() {
  const [country, setCountry] = useState("All");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => keywords.filter(([keyword, market]) =>
    (country === "All" || market === country || (country === "Worldwide" && market === "Worldwide")) &&
    keyword.toLowerCase().includes(query.toLowerCase())
  ), [country, query]);

  const bingUrl = (keyword: string) => `https://www.bing.com/webmasters/keywordresearch?siteUrl=${encodeURIComponent(`${SITE_URL}/`)}&keyword=${encodeURIComponent(keyword)}`;

  return (
    <main className="min-h-screen bg-[#090914] text-white">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-white/10 bg-[#10101c] lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-white/10 px-6"><Link href="/admin" className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7751ff] font-black">C</div><div><div className="font-black">Cinevero</div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9d83ff]">Admin</div></div></Link></div>
        <nav className="space-y-1 px-4 pt-6">
          <Link href="/admin" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#9996a9] hover:bg-white/5 hover:text-white"><BarChart3 size={17}/>Overview</Link>
          <div className="px-3 pb-2 pt-5 text-[10px] font-black uppercase tracking-[.2em] text-[#68657a]">Content</div>
          {[['#movies','Movies',Film],['#series','Series',Tv],['#anime','Anime',WandSparkles]].map(([href,label,Icon]) => <a key={String(href)} href={String(href)} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#9996a9] hover:bg-white/5 hover:text-white"><Icon size={17}/>{String(label)}</a>)}
          <div className="px-3 pb-2 pt-5 text-[10px] font-black uppercase tracking-[.2em] text-[#68657a]">SEO</div>
          <a href="#keywords" className="flex items-center gap-3 rounded-2xl bg-[#7751ff]/15 px-3 py-3 text-sm font-bold text-white ring-1 ring-[#7751ff]/30"><Search size={17} className="text-[#9d83ff]"/>Keyword Research</a>
          <a href="#opportunities" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#9996a9] hover:bg-white/5 hover:text-white"><ListFilter size={17}/>SEO Opportunities</a>
          <div className="px-3 pb-2 pt-5 text-[10px] font-black uppercase tracking-[.2em] text-[#68657a]">Indexing</div>
          <Link href="/admin/indexing" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#9996a9] hover:bg-white/5 hover:text-white"><Send size={17}/>Indexing & Ping</Link>
        </nav>
        <div className="mt-auto border-t border-white/10 p-4"><Link href="/" className="block rounded-2xl bg-white/5 px-3 py-3 text-xs font-bold text-[#aaa6b9] hover:bg-white/10 hover:text-white">← Back to Cinevero</Link></div>
      </aside>

      <div className="lg:pl-64">
        <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="rounded-3xl border border-white/10 bg-[#11111f] p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div className="text-xs font-black uppercase tracking-[.2em] text-[#9d83ff]">CINEVERO SEO</div>
            <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Keyword Research</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#918da2]">Cinevero decision-intent keyword bank built from the opportunities we identified around movie discovery.</p></div>
              <a href={bingUrl("movie")} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7751ff] px-5 py-3 text-sm font-black">Open Bing Research <Globe2 size={16}/></a>
            </div>
          </header>

          <section id="keywords" className="scroll-mt-8 mt-5 rounded-3xl border border-white/10 bg-[#11111f] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-black">Target keyword bank</h2><p className="text-xs text-[#918da2]">Seed keywords to validate in Bing Keyword Research and Search Performance.</p></div><div className="flex flex-wrap gap-2"><select value={country} onChange={e=>setCountry(e.target.value)} className="rounded-xl border border-white/10 bg-[#181827] px-3 py-2 text-xs font-bold">{countries.map(c=><option key={c}>{c}</option>)}</select><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter keywords…" className="rounded-xl border border-white/10 bg-[#181827] px-3 py-2 text-xs outline-none focus:border-[#7751ff]"/></div></div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[1fr_100px_100px_80px_70px] gap-3 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#68657a]"><span>Keyword</span><span>Market</span><span>Intent</span><span>Priority</span><span></span></div>{rows.map(([keyword,market,intent,priority])=><div key={`${keyword}-${market}`} className="grid grid-cols-[1fr_100px_100px_80px_70px] gap-3 border-t border-white/5 px-4 py-3 text-sm"><div className="font-bold">{keyword}</div><span className="text-xs text-[#aaa6b9]">{market}</span><span className="text-xs text-[#b8aaff]">{intent}</span><span className="text-xs font-black">{priority}</span><a href={bingUrl(keyword)} target="_blank" rel="noreferrer" className="text-right text-xs font-black text-[#9d83ff]">Research ↗</a></div>)}{!rows.length&&<div className="p-6 text-center text-sm text-[#68657a]">No matching keywords.</div>}</div>
          </section>

          <section id="opportunities" className="scroll-mt-8 mt-5 grid gap-5 lg:grid-cols-3">
            {[{title:"Decision intent",text:"Build pages around questions such as what movie should I watch and what to watch tonight. Link these pages directly into Cinevero Discover."},{title:"Mood intent",text:"Create useful mood-led discovery paths: bored, date night, family night and mood-based movie discovery."},{title:"Constraint intent",text:"Use time and context as differentiators: movies under 2 hours, thriller recommendations, comedy recommendations and similar decision queries."}].map(item=><article key={item.title} className="rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#211e3a] text-[#9d83ff]"><Search size={18}/></div><h3 className="font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#918da2]">{item.text}</p></article>)}
          </section>

          <section className="mt-5 rounded-3xl border border-[#7751ff]/20 bg-[#141324] p-5"><div className="flex items-start gap-3"><BarChart3 className="mt-0.5 text-[#9d83ff]" size={18}/><div><h2 className="font-black">Important</h2><p className="mt-1 text-sm leading-6 text-[#918da2]">The keyword list above is a Cinevero target bank, not fabricated Bing volume data. Use the Research buttons to validate each term against Bing&apos;s live keyword data. The Bing page you provided showed <b className="text-white">243.8K impressions for “movie”</b> from 13 Jun to 10 Sep 2026, with India, USA, UK and Canada among the displayed markets.</p></div></div></section>
        </div>
      </div>
    </main>
  );
}
