"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Film, Globe2, ListFilter, Menu, Radio, RefreshCw, Search, Send, Tv, WandSparkles, X } from "lucide-react";

const SITE_URL = "https://cinevero.vercel.app";

type Category = { name: string; pageviews: number; visitors: number; pages: number };
type PageRow = { path: string; type: string; pageviews: number; visitors: number };
type Analytics = { ok: boolean; error?: string; range?: number; totals?: { pageviews: number; visitors: number }; categories?: Category[]; topPages?: PageRow[]; trend?: { date: string; pageviews: number; visitors: number }[]; source?: string; note?: string };
type PingState = { busy: boolean; message: string; submitted?: number };

type Keyword = { keyword: string; market: string; intent: string; priority: "High" | "Medium"; target: string };
const keywordSeeds: Keyword[] = [
  { keyword: "what movie should I watch", market: "USA", intent: "Decision", priority: "High", target: "/discover" },
  { keyword: "what to watch tonight", market: "USA", intent: "Decision", priority: "High", target: "/discover" },
  { keyword: "best movies to watch", market: "Worldwide", intent: "Discovery", priority: "High", target: "/movie" },
  { keyword: "movies to watch when bored", market: "USA", intent: "Mood", priority: "High", target: "/discover" },
  { keyword: "movies based on mood", market: "Worldwide", intent: "Mood", priority: "High", target: "/discover" },
  { keyword: "best movies for a date night", market: "USA", intent: "Context", priority: "High", target: "/discover" },
  { keyword: "best movies for family night", market: "USA", intent: "Context", priority: "High", target: "/discover" },
  { keyword: "best movies under 2 hours", market: "USA", intent: "Time", priority: "Medium", target: "/discover" },
  { keyword: "best thriller movies to watch", market: "Worldwide", intent: "Genre", priority: "High", target: "/genres/thriller" },
  { keyword: "best comedy movies to watch", market: "Worldwide", intent: "Genre", priority: "High", target: "/genres/comedy" },
  { keyword: "what movie should I watch tonight", market: "USA", intent: "Decision", priority: "High", target: "/discover" },
];

const navItems = [
  { href: "#overview", label: "Overview", icon: BarChart3 },
  { href: "#movies", label: "Movies", icon: Film },
  { href: "#series", label: "Series", icon: Tv },
  { href: "#anime", label: "Anime", icon: WandSparkles },
  { href: "#pages", label: "Top Pages", icon: Search },
  { href: "/admin/seo", label: "Keyword Research", icon: Search },
  { href: "#indexing", label: "Indexing", icon: ListFilter },
  { href: "#ping", label: "Ping Center", icon: Radio },
];

function fmt(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value > 9999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value || 0);
}

function labelFor(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts.length > 1 ? decodeURIComponent(parts[parts.length - 1]).replace(/[-_]+/g, " ") : "Homepage";
}

export default function AdminDashboard() {
  const [range, setRange] = useState("30");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<"views" | "name">("views");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("#overview");
  const [urls, setUrls] = useState(`${SITE_URL}/\n${SITE_URL}/discover\n${SITE_URL}/movie\n${SITE_URL}/series\n${SITE_URL}/anime\n${SITE_URL}/genres`);
  const [ping, setPing] = useState<PingState>({ busy: false, message: "" });

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?range=${range}`, { cache: "no-store" });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      setAnalytics({ ok: false, error: error instanceof Error ? error.message : "Analytics unavailable" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [range]);

  const filteredPages = useMemo(() => {
    const pages = analytics?.topPages || [];
    const selected = filter === "All" ? pages : pages.filter((page) => page.type === filter);
    return [...selected].sort((a, b) => sort === "views" ? b.pageviews - a.pageviews : labelFor(a.path).localeCompare(labelFor(b.path))).slice(0, 50);
  }, [analytics, filter, sort]);

  const maxTrend = Math.max(...(analytics?.trend || []).map((item) => item.pageviews), 1);
  const categoryMap = new Map((analytics?.categories || []).map((item) => [item.name, item]));

  async function pingIndexNow() {
    const list = Array.from(new Set(urls.split(/\r?\n|,/).map((url) => url.trim()).filter(Boolean)));
    if (!list.length) return;
    setPing({ busy: true, message: "Sending…" });
    try {
      const response = await fetch("/api/admin/indexing/indexnow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls: list }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "IndexNow failed");
      setPing({ busy: false, submitted: data.submitted, message: `Accepted ${data.submitted} URL(s).` });
    } catch (error) {
      setPing({ busy: false, message: error instanceof Error ? error.message : "IndexNow failed" });
    }
  }

  const keywordBingUrl = (keyword: string) => `https://www.bing.com/webmasters/keywordresearch?siteUrl=${encodeURIComponent(`${SITE_URL}/`)}&keyword=${encodeURIComponent(keyword)}`;

  return (
    <main className="min-h-screen bg-[#090914] text-white">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-white/10 bg-[#10101c] lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-white/10 px-6">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setActive("#overview")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7751ff] text-lg font-black">C</div>
            <div><div className="font-black tracking-tight">Cinevero</div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9d83ff]">Admin</div></div>
          </Link>
        </div>
        <div className="px-4 pt-6">
          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.2em] text-[#68657a]">Control center</div>
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              href.startsWith("/") ? (
                <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#9996a9] hover:bg-white/5 hover:text-white"><Icon size={17}/>{label}</Link>
              ) : (
                <a key={href} href={href} onClick={() => setActive(href)} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${active === href ? "bg-[#7751ff]/15 text-white ring-1 ring-[#7751ff]/30" : "text-[#9996a9] hover:bg-white/5 hover:text-white"}`}>
                  <Icon size={17} className={active === href ? "text-[#9d83ff]" : ""} />{label}
                </a>
              )
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 p-4">
          <Link href="/" className="block rounded-2xl bg-white/5 px-3 py-3 text-xs font-bold text-[#aaa6b9] hover:bg-white/10 hover:text-white">← Back to Cinevero</Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090914]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7751ff] font-black">C</div><span className="font-black">Cinevero Admin</span></Link>
            <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl border border-white/10 p-2.5">{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button>
          </div>
          {mobileOpen && <nav className="mt-3 grid grid-cols-2 gap-1 border-t border-white/10 pt-3 sm:grid-cols-4">{navItems.map(({href,label,icon:Icon}) => href.startsWith("/") ? <Link key={href} href={href} onClick={()=>setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-[#aaa6b9] hover:bg-white/5 hover:text-white"><Icon size={14}/>{label}</Link> : <a key={href} href={href} onClick={() => { setActive(href); setMobileOpen(false); }} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-[#aaa6b9] hover:bg-white/5 hover:text-white"><Icon size={14}/>{label}</a>)}</nav>}
        </header>

        <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="rounded-3xl border border-white/10 bg-[#11111f] p-5 shadow-2xl shadow-black/20 sm:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div><div className="mb-2 text-xs font-black uppercase tracking-[.2em] text-[#9d83ff]">CINEVERO ADMIN</div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Control Center</h1><p className="mt-2 max-w-2xl text-sm text-[#918da2]">Traffic, movies, series, anime, SEO, indexing and search-engine pings — all in one place.</p></div>
              <div className="flex items-center gap-2"><select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-xl border border-white/10 bg-[#181827] px-3 py-2 text-sm font-bold outline-none"><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select><button onClick={load} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-[#aaa6b9] hover:bg-white/10 hover:text-white" title="Refresh"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/></button></div>
            </div>
          </section>

          {!analytics?.ok && <section className="mt-5 rounded-3xl border border-[#7751ff]/30 bg-[#211e3a] p-6"><h2 className="text-lg font-black">Analytics connection</h2><p className="mt-2 text-sm text-[#aaa6b9]">{analytics?.error || "Enable Vercel Web Analytics and add a server-only Vercel read token."}</p><div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-xs text-[#c8c2df]">VERCEL_ANALYTICS_TOKEN=your_read_token</div></section>}

          <section id="overview" className="scroll-mt-24 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[{label:"Page views",value:analytics?.totals?.pageviews || 0,icon:BarChart3},{label:"Visitors",value:analytics?.totals?.visitors || 0,icon:Radio},{label:"Movie views",value:categoryMap.get("Movies")?.pageviews || 0,icon:Film},{label:"Series views",value:categoryMap.get("Series")?.pageviews || 0,icon:Tv}].map(({label,value,icon:Icon}) => <div key={label} className="rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#918da2]">{label}</span><Icon size={17} className="text-[#9d83ff]"/></div><div className="mt-3 text-3xl font-black">{loading ? "…" : fmt(value)}</div><div className="mt-1 text-[11px] text-[#68657a]">Production · last {analytics?.range || range} days</div></div>)}
          </section>

          <section id="trend" className="scroll-mt-24 mt-5 grid gap-5 xl:grid-cols-[1.5fr_.8fr]">
            <div className="rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex items-center justify-between"><div><h2 className="font-black">Traffic trend</h2><p className="text-xs text-[#918da2]">Real Vercel Web Analytics page views</p></div><span className="rounded-full bg-[#211e3a] px-3 py-1 text-[11px] font-bold text-[#b8aaff]">{analytics?.source || "Waiting"}</span></div><div className="mt-5 flex h-48 items-end gap-1.5 overflow-hidden">{(analytics?.trend || []).map((item) => <div key={item.date} title={`${item.date}: ${fmt(item.pageviews)} views`} className="min-w-1.5 flex-1 rounded-t bg-[#7751ff] hover:bg-[#9d83ff]" style={{height:`${Math.max(3,(item.pageviews/maxTrend)*100)}%`}}/>)}</div></div>
            <div className="rounded-3xl border border-white/10 bg-[#11111f] p-5"><h2 className="font-black">Content split</h2><div className="mt-4 space-y-4">{["Movies","Series","Anime"].map((name) => { const item=categoryMap.get(name); return <div key={name}><div className="mb-1 flex justify-between text-xs"><span className="font-bold">{name}</span><span className="text-[#918da2]">{fmt(item?.pageviews || 0)}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-[#7751ff]" style={{width:`${Math.min(100,((item?.pageviews || 0)/Math.max(1,analytics?.totals?.pageviews || 1))*100)}%`}}/></div></div> })}</div></div>
          </section>

          <section id="pages" className="scroll-mt-24 mt-5 rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">Content traffic</h2><p className="text-xs text-[#918da2]">Sort and filter real page views by content type.</p></div><div className="flex gap-2"><select value={filter} onChange={(e)=>setFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#181827] px-3 py-2 text-xs font-bold"><option>All</option><option>Movies</option><option>Series</option><option>Anime</option><option>Other</option></select><select value={sort} onChange={(e)=>setSort(e.target.value as "views"|"name")} className="rounded-xl border border-white/10 bg-[#181827] px-3 py-2 text-xs font-bold"><option value="views">Sort: Views</option><option value="name">Sort: Name</option></select></div></div><div className="mt-4 overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[1fr_100px_100px] gap-3 bg-white/5 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#68657a]"><span>Page</span><span>Type</span><span className="text-right">Views</span></div>{filteredPages.map((page) => <div key={page.path} className="grid grid-cols-[1fr_100px_100px] gap-3 border-t border-white/5 px-4 py-3 text-sm"><div className="min-w-0"><div className="truncate font-bold capitalize">{labelFor(page.path)}</div><div className="truncate text-[11px] text-[#68657a]">{page.path}</div></div><span className="text-xs font-bold text-[#b8aaff]">{page.type}</span><span className="text-right font-black">{fmt(page.pageviews)}</span></div>)}{!filteredPages.length && <div className="p-6 text-center text-sm text-[#68657a]">No analytics pages available for this filter.</div>}</div></section>

          {["Movies","Series","Anime"].map((name) => <section key={name} id={name.toLowerCase()} className="scroll-mt-24 mt-5 rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex items-center justify-between"><div><h2 className="font-black">{name}</h2><p className="text-xs text-[#918da2]">Traffic summary from real visitors.</p></div><span className="rounded-full bg-[#211e3a] px-3 py-1 text-xs font-black text-[#b8aaff]">{fmt(categoryMap.get(name)?.pageviews || 0)} views</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-[#918da2]">Views</div><div className="mt-1 text-2xl font-black">{fmt(categoryMap.get(name)?.pageviews || 0)}</div></div><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-[#918da2]">Visitors</div><div className="mt-1 text-2xl font-black">{fmt(categoryMap.get(name)?.visitors || 0)}</div></div><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-[#918da2]">Tracked pages</div><div className="mt-1 text-2xl font-black">{fmt(categoryMap.get(name)?.pages || 0)}</div></div></div></section>)}

          <section id="seo" className="scroll-mt-24 mt-5 rounded-3xl border border-[#7751ff]/20 bg-[#11111f] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="mb-1 text-[10px] font-black uppercase tracking-[.2em] text-[#9d83ff]">SEO</div><h2 className="text-xl font-black">Keyword Research</h2><p className="mt-1 text-xs text-[#918da2]">Cinevero decision-intent seed keywords ready for live validation in Bing.</p></div><Link href="/admin/seo" className="inline-flex items-center gap-2 rounded-xl bg-[#7751ff] px-4 py-2.5 text-xs font-black">Open Keyword Research <Search size={14}/></Link></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{keywordSeeds.slice(0,6).map((item)=><a key={item.keyword} href={keywordBingUrl(item.keyword)} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-[#7751ff]/40"><div className="text-sm font-bold">{item.keyword}</div><div className="mt-1 text-[10px] text-[#918da2]">{item.market} · {item.intent} · {item.priority}</div></a>)}</div>
          </section>

          <section id="indexing" className="scroll-mt-24 mt-5 rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-black">Indexing Center</h2><p className="text-xs text-[#918da2]">Google Search Console inspection + IndexNow.</p></div><Link href="/admin/indexing" className="rounded-xl bg-[#7751ff] px-4 py-2 text-xs font-black text-white">Open full indexing</Link></div></section>

          <section id="ping" className="scroll-mt-24 mt-5 rounded-3xl border border-white/10 bg-[#11111f] p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-black">Ping Center</h2><p className="mt-1 text-xs text-[#918da2]">Send changed Cinevero URLs to IndexNow in bulk.</p></div><Send size={18} className="text-[#9d83ff]"/></div><textarea value={urls} onChange={(e)=>setUrls(e.target.value)} rows={7} className="mt-4 w-full rounded-2xl border border-white/10 bg-[#0e0e1d] p-4 font-mono text-xs text-white outline-none focus:border-[#7751ff]"/><div className="mt-3 flex flex-wrap items-center gap-3"><button onClick={pingIndexNow} disabled={ping.busy} className="rounded-xl bg-[#7751ff] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{ping.busy ? "Sending…" : "Ping IndexNow"}</button><a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-[#aaa6b9] hover:bg-white/5">Open sitemap</a>{ping.message && <span className="text-xs font-bold text-[#b8aaff]">{ping.message}</span>}</div></section>
        </div>
      </div>
    </main>
  );
}
