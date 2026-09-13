"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Chrome, ExternalLink, Film, Globe2, Laptop, ListFilter, Menu, Monitor, Radio, RefreshCw, Search, Send, Smartphone, Tablet, Tv, WandSparkles, X } from "lucide-react";

const SITE_URL = "https://cinevero.vercel.app";

type Row = { name: string; pageviews: number; visitors: number };
type PageRow = { path: string; type: string; pageviews: number; visitors: number };
type Analytics = {
  ok: boolean; error?: string; range?: number; source?: string; note?: string;
  totals?: { pageviews: number; visitors: number };
  categories?: { name: string; pageviews: number; visitors: number; pages: number }[];
  topPages?: PageRow[]; trend?: { date: string; pageviews: number; visitors: number }[];
  country?: Row[]; referrers?: Row[]; browsers?: Row[]; devices?: Row[];
};

type Ping = { busy: boolean; message: string };

const navItems = [
  ["#overview", "Overview", BarChart3], ["#movies", "Movies", Film], ["#series", "Series", Tv], ["#anime", "Anime", WandSparkles],
  ["#traffic", "Traffic Sources", Globe2], ["#pages", "Top Pages", Search], ["/admin/seo", "Keyword Research", Search],
  ["#indexing", "Indexing", ListFilter], ["#ping", "Ping Center", Radio],
] as const;

function fmt(n: number) { return new Intl.NumberFormat("en-US", { notation: n > 9999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n || 0); }
function labelFor(path: string) { const p = path.split("/").filter(Boolean); return p.length > 1 ? decodeURIComponent(p[p.length - 1]).replace(/[-_]+/g, " ") : "Homepage"; }
function barWidth(value: number, rows: Row[]) { const max = Math.max(...rows.map(r => r.pageviews), 1); return `${Math.max(3, Math.min(100, value / max * 100))}%`; }

function DataTable({ rows, empty }: { rows: Row[]; empty: string }) {
  if (!rows.length) return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5 text-center text-sm text-[#777389]">{empty}</div>;
  return <div className="space-y-2">{rows.map((r, i) => <div key={`${r.name}-${i}`} className="rounded-2xl border border-white/10 bg-white/[.03] p-3.5">
    <div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{r.name || "Unknown"}</div><div className="mt-1 text-[11px] text-[#777389]">{fmt(r.visitors)} visitors · {fmt(r.pageviews)} page views</div></div><span className="text-xs font-black text-[#b8aaff]">{fmt(r.pageviews)}</span></div>
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-[#7751ff]" style={{ width: barWidth(r.pageviews, rows) }} /></div>
  </div>)}</div>;

export default function AdminDashboardV2() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("views");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("#overview");
  const [urls, setUrls] = useState(`${SITE_URL}/\n${SITE_URL}/discover\n${SITE_URL}/movie\n${SITE_URL}/series\n${SITE_URL}/anime\n${SITE_URL}/faq`);
  const [ping, setPing] = useState<Ping>({ busy: false, message: "" });

  async function load() {
    setLoading(true);
    try { const r = await fetch(`/api/admin/analytics?range=${range}`, { cache: "no-store" }); setData(await r.json()); }
    catch (e) { setData({ ok: false, error: e instanceof Error ? e.message : "Analytics unavailable" }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [range]);

  const pages = useMemo(() => {
    const base = data?.topPages || [];
    const selected = filter === "All" ? base : base.filter(p => p.type === filter);
    return [...selected].sort((a, b) => sort === "views" ? b.pageviews - a.pageviews : labelFor(a.path).localeCompare(labelFor(b.path))).slice(0, 50);
  }, [data, filter, sort]);
  const categories = new Map((data?.categories || []).map(x => [x.name, x]));

  async function pingIndexNow() {
    const list = Array.from(new Set(urls.split(/\r?\n|,/).map(x => x.trim()).filter(Boolean)));
    if (!list.length) return;
    setPing({ busy: true, message: "Sending…" });
    try { const r = await fetch("/api/admin/indexing/indexnow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls: list }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error || "IndexNow failed"); setPing({ busy: false, message: `Accepted ${j.submitted} URL(s).` }); }
    catch (e) { setPing({ busy: false, message: e instanceof Error ? e.message : "IndexNow failed" }); }
  }

  return <main className="min-h-screen bg-[#090914] text-white">
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-white/10 bg-[#10101c] lg:flex lg:flex-col">
      <div className="flex h-20 items-center border-b border-white/10 px-6"><Link href="/admin" className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7751ff] font-black">C</div><div><div className="font-black">Cinevero</div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9d83ff]">Admin</div></div></Link></div>
      <div className="px-4 pt-6"><div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.2em] text-[#68657a]">Control center</div><nav className="space-y-1">{navItems.map(([href, label, Icon]) => href.startsWith("/") ? <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#9996a9] hover:bg-white/5 hover:text-white"><Icon size={17}/>{label}</Link> : <a key={href} href={href} onClick={() => setActive(href)} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold ${active === href ? "bg-[#7751ff]/15 text-white ring-1 ring-[#7751ff]/30" : "text-[#9996a9] hover:bg-white/5 hover:text-white"}`}><Icon size={17} className={active === href ? "text-[#9d83ff]" : ""}/>{label}</a>)}</nav></div>
      <div className="mt-auto border-t border-white/10 p-4"><Link href="/" className="block rounded-2xl bg-white/5 px-3 py-3 text-xs font-bold text-[#aaa6b9]">← Back to Cinevero</Link></div>
    </aside>

    <div className="lg:pl-64">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090914]/90 px-4 py-3 backdrop-blur-xl lg:hidden"><div className="flex items-center justify-between"><Link href="/admin" className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7751ff] font-black">C</div><span className="font-black">Cinevero Admin</span></Link><button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl border border-white/10 p-2.5">{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button></div>{mobileOpen && <nav className="mt-3 grid grid-cols-2 gap-1 border-t border-white/10 pt-3 sm:grid-cols-4">{navItems.map(([href,label,Icon]) => href.startsWith("/") ? <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-[#aaa6b9]"><Icon size={14}/>{label}</Link> : <a key={href} href={href} onClick={() => {setActive(href);setMobileOpen(false)}} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-[#aaa6b9]"><Icon size={14}/>{label}</a>)}</nav>}</header>

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-3xl border border-white/10 bg-[#11111f] p-5 shadow-2xl sm:p-7"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-2 text-xs font-black uppercase tracking-[.2em] text-[#9d83ff]">CINEVERO ADMIN</div><h1 className="text-3xl font-black sm:text-4xl">Control Center</h1><p className="mt-2 max-w-3xl text-sm text-[#918da2]">Real production traffic, audience geography, referrers, browsers, devices, content performance, SEO and indexing.</p></div><div className="flex gap-2"><select value={range} onChange={e => setRange(e.target.value)} className="rounded-xl border border-white/10 bg-[#181827] px-3 py-2 text-sm font-bold"><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select><button onClick={load} className="rounded-xl border border-white/10 bg-white/5 p-2.5" title="Refresh"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/></button></div></div></section>

        {!data?.ok && <section className="mt-5 rounded-3xl border border-[#7751ff]/30 bg-[#211e3a] p-6"><h2 className="font-black">Analytics connection</h2><p className="mt-2 text-sm text-[#aaa6b9]">{data?.error || "Enable Vercel Web Analytics and configure the server-only read token."}</p></section>}

        <section id="overview" className="scroll-mt-24 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Page views",data?.totals?.pageviews || 0,BarChart3],["Unique visitors",data?.totals?.visitors || 0,Radio],["Countries",data?.country?.length || 0,Globe2],["Top referrers",data?.referrers?.length || 0,ExternalLink]].map(([label,value,Icon]) => <div key={String(label)} className="rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex justify-between text-xs font-bold text-[#918da2]"><span>{label}</span><Icon size={17} className="text-[#9d83ff]"/></div><div className="mt-3 text-3xl font-black">{loading ? "…" : fmt(Number(value))}</div><div className="mt-1 text-[11px] text-[#68657a]">Production · last {data?.range || range} days</div></div>)}</section>

        <section id="traffic" className="scroll-mt-24 mt-5 grid gap-5 xl:grid-cols-2"><div className="rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex items-center justify-between"><div><h2 className="font-black">Visitors by country</h2><p className="text-xs text-[#918da2]">Real Web Analytics country aggregation.</p></div><Globe2 size={18} className="text-[#9d83ff]"/></div><div className="mt-4"><DataTable rows={data?.country || []} empty="No country data yet."/></div></div><div className="rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex items-center justify-between"><div><h2 className="font-black">Referrers</h2><p className="text-xs text-[#918da2]">Where production visitors arrived from.</p></div><ExternalLink size={18} className="text-[#9d83ff]"/></div><div className="mt-4"><DataTable rows={data?.referrers || []} empty="No referrer data yet."/></div></div></section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2"><div className="rounded-3xl border border-white/10 bg-[#11111f] p-5"><h2 className="font-black">Browsers</h2><p className="text-xs text-[#918da2]">Real visitor browser distribution.</p><div className="mt-4"><DataTable rows={data?.browsers || []} empty="No browser data yet."/></div></div><div className="rounded-3xl border border-white/10 bg-[#11111f] p-5"><h2 className="font-black">Devices</h2><p className="text-xs text-[#918da2]">Real visitor device distribution.</p><div className="mt-4"><DataTable rows={data?.devices || []} empty="No device data yet."/></div></div></section>

        <section id="pages" className="scroll-mt-24 mt-5 rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">Top Pages</h2><p className="text-xs text-[#918da2]">Real production page views by route.</p></div><div className="flex gap-2"><select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#181827] px-3 py-2 text-xs font-bold"><option>All</option><option>Movies</option><option>Series</option><option>Anime</option><option>Other</option></select><select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-xl border border-white/10 bg-[#181827] px-3 py-2 text-xs font-bold"><option value="views">Sort: Views</option><option value="name">Sort: Name</option></select></div></div><div className="mt-4 overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[1fr_100px_100px] gap-3 bg-white/5 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#68657a]"><span>Page</span><span>Type</span><span className="text-right">Views</span></div>{pages.map(p=><div key={p.path} className="grid grid-cols-[1fr_100px_100px] gap-3 border-t border-white/5 px-4 py-3 text-sm"><div className="min-w-0"><div className="truncate font-bold capitalize">{labelFor(p.path)}</div><div className="truncate text-[11px] text-[#68657a]">{p.path}</div></div><span className="text-xs font-bold text-[#b8aaff]">{p.type}</span><span className="text-right font-black">{fmt(p.pageviews)}</span></div>)}</div></section>

        {["Movies","Series","Anime"].map(name => <section key={name} id={name.toLowerCase()} className="scroll-mt-24 mt-5 rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex justify-between"><div><h2 className="font-black">{name}</h2><p className="text-xs text-[#918da2]">Real production traffic.</p></div><span className="rounded-full bg-[#211e3a] px-3 py-1 text-xs font-black text-[#b8aaff]">{fmt(categories.get(name)?.pageviews || 0)} views</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-[#918da2]">Views</div><div className="mt-1 text-2xl font-black">{fmt(categories.get(name)?.pageviews || 0)}</div></div><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-[#918da2]">Visitors</div><div className="mt-1 text-2xl font-black">{fmt(categories.get(name)?.visitors || 0)}</div></div><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-[#918da2]">Tracked pages</div><div className="mt-1 text-2xl font-black">{fmt(categories.get(name)?.pages || 0)}</div></div></div></section>)}

        <section className="mt-5 rounded-3xl border border-[#7751ff]/20 bg-[#11111f] p-5"><div className="flex items-center justify-between"><div><h2 className="font-black">Search & SEO</h2><p className="text-xs text-[#918da2]">Keyword research, Search Console inspection and sitemap controls.</p></div><Link href="/admin/seo" className="rounded-xl bg-[#7751ff] px-4 py-2.5 text-xs font-black">Open SEO Research</Link></div></section>
        <section id="indexing" className="scroll-mt-24 mt-5 rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-black">Indexing Center</h2><p className="text-xs text-[#918da2]">Google Search Console inspection + IndexNow.</p></div><Link href="/admin/indexing" className="rounded-xl bg-[#7751ff] px-4 py-2 text-xs font-black">Open full indexing</Link></div></section>
        <section id="ping" className="scroll-mt-24 mt-5 rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex items-start justify-between"><div><h2 className="font-black">Ping Center</h2><p className="mt-1 text-xs text-[#918da2]">Send changed Cinevero URLs to IndexNow in bulk.</p></div><Send size={18} className="text-[#9d83ff]"/></div><textarea value={urls} onChange={e=>setUrls(e.target.value)} rows={6} className="mt-4 w-full rounded-2xl border border-white/10 bg-[#0e0e1d] p-4 font-mono text-xs outline-none focus:border-[#7751ff]"/><div className="mt-3 flex flex-wrap items-center gap-3"><button onClick={pingIndexNow} disabled={ping.busy} className="rounded-xl bg-[#7751ff] px-4 py-2.5 text-sm font-black disabled:opacity-50">{ping.busy ? "Sending…" : "Ping IndexNow"}</button><a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-[#aaa6b9]">Open sitemap</a>{ping.message && <span className="text-xs font-bold text-[#b8aaff]">{ping.message}</span>}</div></section>
      </div>
    </div>
  </main>;
}
