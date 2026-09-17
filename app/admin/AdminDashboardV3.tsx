"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, ExternalLink, Film, Globe2, ListFilter, Menu, Radio, RefreshCw, Search, Send, Tv, WandSparkles, X } from "lucide-react";

const SITE_URL = "https://cinevero.vercel.app";
type Row = { name: string; pageviews: number; visitors: number };
type PageRow = { path: string; type: string; pageviews: number; visitors: number };
type Analytics = { ok: boolean; error?: string; range?: number; source?: string; totals?: { pageviews: number; visitors: number }; categories?: { name: string; pageviews: number; visitors: number; pages: number }[]; topPages?: PageRow[]; country?: Row[]; referrers?: Row[]; browsers?: Row[]; devices?: Row[] };

const nav = [
  ["#overview", "Overview", BarChart3], ["#movies", "Movies", Film], ["#series", "Series", Tv], ["#anime", "Anime", WandSparkles],
  ["#traffic", "Traffic Sources", Globe2], ["#pages", "Top Pages", Search], ["/admin/seo", "Keyword Research", Search], ["#indexing", "Indexing", ListFilter], ["#ping", "Ping Center", Radio],
] as const;
function fmt(n: number) { return new Intl.NumberFormat("en-US", { notation: n > 9999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n || 0); }
function pageName(path: string) { const p = path.split("/").filter(Boolean); return p.length ? decodeURIComponent(p[p.length - 1]).replace(/[-_]+/g, " ") : "Homepage"; }

function RankedList({ rows, empty }: { rows: Row[]; empty: string }) {
  if (!rows.length) return <div className="rounded-2xl border border-white/5 bg-white/[.025] p-6 text-center text-sm text-[#777389]">{empty}</div>;
  const max = Math.max(...rows.map(r => r.pageviews), 1);
  return <div className="space-y-2">{rows.map((r, i) => <div key={`${r.name}-${i}`} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5 transition-colors hover:border-white/15 hover:bg-white/[.04]"><div className="flex justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{r.name || "Unknown"}</div><div className="mt-1 text-[11px] text-[#777389]">{fmt(r.visitors)} visitors · {fmt(r.pageviews)} views</div></div><span className="shrink-0 text-xs font-black text-[#b8aaff]">{fmt(r.pageviews)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-[#7751ff] transition-all" style={{ width: `${Math.max(3, Math.min(100, r.pageviews / max * 100))}%` }} /></div></div>)}</div>;
}

const card = "rounded-3xl border border-white/[.08] bg-[#11111f] shadow-[0_12px_40px_rgba(0,0,0,.12)]";
const control = "rounded-xl border border-white/10 bg-[#181827] px-3 py-2 text-sm font-bold outline-none transition-colors hover:border-white/20 focus:border-[#7751ff]";

export default function AdminDashboardV3() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("views");
  const [mobile, setMobile] = useState(false);
  const [active, setActive] = useState("#overview");
  const [urls, setUrls] = useState(`${SITE_URL}/\n${SITE_URL}/discover\n${SITE_URL}/movie\n${SITE_URL}/series\n${SITE_URL}/anime\n${SITE_URL}/faq`);
  const [ping, setPing] = useState("");

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
    return [...selected].sort((a, b) => sort === "views" ? b.pageviews - a.pageviews : pageName(a.path).localeCompare(pageName(b.path))).slice(0, 50);
  }, [data, filter, sort]);
  const categoryMap = new Map((data?.categories || []).map(x => [x.name, x]));

  async function pingIndexNow() {
    const list = Array.from(new Set(urls.split(/\r?\n|,/).map(x => x.trim()).filter(Boolean)));
    if (!list.length) return;
    setPing("Sending…");
    try { const r = await fetch("/api/admin/indexing/indexnow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls: list }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error || "IndexNow failed"); setPing(`Accepted ${j.submitted} URL(s).`); }
    catch (e) { setPing(e instanceof Error ? e.message : "IndexNow failed"); }
  }

  const jump = (href: string) => { setActive(href); setMobile(false); };

  return <main className="min-h-screen bg-[#08080f] text-white selection:bg-[#7751ff]/30">
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-white/[.08] bg-[#0e0e18] lg:flex lg:flex-col"><div className="flex h-20 items-center border-b border-white/[.08] px-6"><Link href="/admin" className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7751ff] font-black shadow-lg shadow-[#7751ff]/20">C</div><div><div className="font-black tracking-tight">Cinevero</div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9d83ff]">Admin Console</div></div></Link></div><div className="flex-1 overflow-y-auto px-4 pt-6"><div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.2em] text-[#68657a]">Control center</div><nav className="space-y-1">{nav.map(([href,label,Icon]) => href.startsWith("/") ? <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#9996a9] transition-colors hover:bg-white/5 hover:text-white"><Icon size={17}/><span>{label}</span><ExternalLink size={12} className="ml-auto opacity-0 transition-opacity group-hover:opacity-50"/></Link> : <a key={href} href={href} onClick={() => jump(href)} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-colors ${active === href ? "bg-[#7751ff]/15 text-white ring-1 ring-[#7751ff]/30" : "text-[#9996a9] hover:bg-white/5 hover:text-white"}`}><Icon size={17}/>{label}</a>)}</nav></div><div className="border-t border-white/[.08] p-4"><Link href="/" className="block rounded-2xl bg-white/5 px-3 py-3 text-xs font-bold transition-colors hover:bg-white/10">← Back to Cinevero</Link></div></aside>

    <div className="lg:pl-64"><header className="sticky top-0 z-40 border-b border-white/[.08] bg-[#08080f]/90 px-4 py-3 backdrop-blur-xl lg:hidden"><div className="flex items-center justify-between"><Link href="/admin" className="font-black tracking-tight">Cinevero Admin</Link><button aria-label="Toggle admin navigation" onClick={() => setMobile(!mobile)} className="rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10">{mobile ? <X size={18}/> : <Menu size={18}/>}</button></div>{mobile && <nav className="mt-3 grid grid-cols-2 gap-1 border-t border-white/10 pt-3">{nav.map(([href,label,Icon]) => href.startsWith("/") ? <Link key={href} href={href} onClick={() => setMobile(false)} className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold text-[#aaa6b9] hover:bg-white/5 hover:text-white"><Icon size={14}/>{label}</Link> : <a key={href} href={href} onClick={() => jump(href)} className={`flex items-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold ${active === href ? "bg-[#7751ff]/15 text-white" : "text-[#aaa6b9]"}`}><Icon size={14}/>{label}</a>)}</nav>}</header>

    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8"><section className={`${card} overflow-hidden p-5 sm:p-7`}><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-2 inline-flex rounded-full border border-[#7751ff]/20 bg-[#7751ff]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.2em] text-[#9d83ff]">CINEVERO ADMIN</div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Control Center</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#918da2]">Real production visitors, countries, referrers, browsers, devices, content traffic, SEO and indexing.</p></div><div className="flex gap-2"><select aria-label="Analytics range" value={range} onChange={e => setRange(e.target.value)} className={control}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select><button aria-label="Refresh analytics" onClick={load} className="rounded-xl border border-white/10 bg-white/5 p-2.5 transition-colors hover:bg-white/10"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/></button></div></div></section>

    {!data?.ok && <section className="mt-5 rounded-3xl border border-[#7751ff]/30 bg-[#211e3a] p-6"><h2 className="font-black">Analytics connection</h2><p className="mt-2 text-sm text-[#aaa6b9]">{data?.error || "Enable Vercel Web Analytics and configure the server-only read token."}</p></section>}

    <section id="overview" className="scroll-mt-24 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Page views",data?.totals?.pageviews || 0],["Unique visitors",data?.totals?.visitors || 0],["Countries",data?.country?.length || 0],["Referrers",data?.referrers?.length || 0]].map(([label,value]) => <div key={String(label)} className={`${card} p-5 transition-transform hover:-translate-y-0.5`}><div className="text-xs font-bold text-[#918da2]">{label}</div><div className="mt-3 text-3xl font-black tracking-tight">{loading ? "…" : fmt(Number(value))}</div><div className="mt-1 text-[11px] text-[#68657a]">Production · last {data?.range || range} days</div></div>)}</section>

    <section id="traffic" className="scroll-mt-24 mt-5 grid gap-5 xl:grid-cols-2"><div className={`${card} p-5`}><h2 className="font-black">Visitors by country</h2><p className="mt-1 text-xs text-[#918da2]">Real aggregated Web Analytics dimensions.</p><div className="mt-4"><RankedList rows={data?.country || []} empty="No country data yet."/></div></div><div className={`${card} p-5`}><h2 className="font-black">Referrers</h2><p className="mt-1 text-xs text-[#918da2]">Where production traffic arrived from.</p><div className="mt-4"><RankedList rows={data?.referrers || []} empty="No referrer data yet."/></div></div></section>

    <section className="mt-5 grid gap-5 xl:grid-cols-2"><div className={`${card} p-5`}><h2 className="font-black">Browsers</h2><p className="mt-1 text-xs text-[#918da2]">Real browser distribution.</p><div className="mt-4"><RankedList rows={data?.browsers || []} empty="No browser data yet."/></div></div><div className={`${card} p-5`}><h2 className="font-black">Devices</h2><p className="mt-1 text-xs text-[#918da2]">Real device distribution.</p><div className="mt-4"><RankedList rows={data?.devices || []} empty="No device data yet."/></div></div></section>

    <section id="pages" className={`scroll-mt-24 mt-5 ${card} p-5`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">Top Pages</h2><p className="text-xs text-[#918da2]">Real production page views.</p></div><div className="flex gap-2"><select value={filter} onChange={e=>setFilter(e.target.value)} className={`${control} text-xs`}><option>All</option><option>Movies</option><option>Series</option><option>Anime</option><option>Other</option></select><select value={sort} onChange={e=>setSort(e.target.value)} className={`${control} text-xs`}><option value="views">Sort: Views</option><option value="name">Sort: Name</option></select></div></div><div className="mt-4 overflow-x-auto rounded-2xl border border-white/[.07]"><div className="min-w-[620px]"><div className="grid grid-cols-[1fr_100px_100px] gap-3 bg-white/5 px-4 py-3 text-[11px] font-black uppercase text-[#68657a]"><span>Page</span><span>Type</span><span className="text-right">Views</span></div>{pages.length ? pages.map(p => <div key={p.path} className="grid grid-cols-[1fr_100px_100px] gap-3 border-t border-white/5 px-4 py-3 text-sm transition-colors hover:bg-white/[.025]"><div className="min-w-0"><div className="truncate font-bold capitalize">{pageName(p.path)}</div><div className="truncate text-[11px] text-[#68657a]">{p.path}</div></div><span className="text-xs font-bold text-[#b8aaff]">{p.type}</span><span className="text-right font-black">{fmt(p.pageviews)}</span></div>) : <div className="px-4 py-10 text-center text-sm text-[#777389]">No page data for this range.</div>}</div></div></section>

    {["Movies","Series","Anime"].map(name => <section key={name} id={name.toLowerCase()} className={`scroll-mt-24 mt-5 ${card} p-5`}><div className="flex justify-between"><div><h2 className="font-black">{name}</h2><p className="text-xs text-[#918da2]">Real production traffic.</p></div><span className="rounded-full border border-[#7751ff]/20 bg-[#211e3a] px-3 py-1 text-xs font-black text-[#b8aaff]">{fmt(categoryMap.get(name)?.pageviews || 0)} views</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/5 bg-white/[.03] p-4"><div className="text-xs text-[#918da2]">Views</div><div className="mt-1 text-2xl font-black">{fmt(categoryMap.get(name)?.pageviews || 0)}</div></div><div className="rounded-2xl border border-white/5 bg-white/[.03] p-4"><div className="text-xs text-[#918da2]">Visitors</div><div className="mt-1 text-2xl font-black">{fmt(categoryMap.get(name)?.visitors || 0)}</div></div><div className="rounded-2xl border border-white/5 bg-white/[.03] p-4"><div className="text-xs text-[#918da2]">Tracked pages</div><div className="mt-1 text-2xl font-black">{fmt(categoryMap.get(name)?.pages || 0)}</div></div></div></section>)}

    <section className={`mt-5 ${card} border-[#7751ff]/20 p-5`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">Search & SEO</h2><p className="text-xs text-[#918da2]">Keyword research and Search Console tooling.</p></div><Link href="/admin/seo" className="rounded-xl bg-[#7751ff] px-4 py-2.5 text-center text-xs font-black transition-colors hover:bg-[#8866ff]">Open SEO Research</Link></div></section>
    <section id="indexing" className={`scroll-mt-24 mt-5 ${card} p-5`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">Indexing Center</h2><p className="text-xs text-[#918da2]">Google Search Console inspection + IndexNow.</p></div><Link href="/admin/indexing" className="rounded-xl bg-[#7751ff] px-4 py-2 text-center text-xs font-black transition-colors hover:bg-[#8866ff]">Open full indexing</Link></div></section>
    <section id="ping" className={`scroll-mt-24 mt-5 ${card} p-5`}><div className="flex items-start justify-between"><div><h2 className="font-black">Ping Center</h2><p className="mt-1 text-xs text-[#918da2]">Send changed Cinevero URLs to IndexNow.</p></div><Send size={18} className="text-[#9d83ff]"/></div><textarea value={urls} onChange={e=>setUrls(e.target.value)} rows={6} className="mt-4 w-full rounded-2xl border border-white/10 bg-[#0e0e1d] p-4 font-mono text-xs outline-none transition-colors focus:border-[#7751ff]"/><div className="mt-3 flex flex-wrap items-center gap-3"><button onClick={pingIndexNow} className="rounded-xl bg-[#7751ff] px-4 py-2.5 text-sm font-black transition-colors hover:bg-[#8866ff]">Ping IndexNow</button><a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white/5">Open sitemap</a>{ping && <span className="text-xs font-bold text-[#b8aaff]">{ping}</span>}</div></section>
    </div></div>
  </main>;
}
