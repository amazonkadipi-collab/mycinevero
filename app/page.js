"use client";

import { useCallback, useEffect, useState } from "react";
import VideoGrid from "../components/VideoGrid";
import VideoModal from "../components/VideoModal";
import Pagination from "../components/Pagination";
import styles from "../styles/Home.module.css";

const DEFAULT_SETTINGS = { query:"all", order:"latest", per_page:24, thumbsize:"medium", gay:0, lq:1, format:"json" };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "API_URL_PLACEHOLDER";

export default function HomePage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    fetch("/api/settings", { cache:"no-store" }).then(r => r.json()).then(data => {
      if (data?.success) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    }).catch(() => {});
  }, []);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("q", query.trim() || settings.query);
      params.set("order", settings.order);
      params.set("per_page", String(settings.per_page));
      params.set("thumbsize", settings.thumbsize);
      params.set("gay", String(settings.gay));
      params.set("lq", String(settings.lq));
      params.set("format", settings.format);
      params.set("page", String(page));
      const response = await fetch(`/api/videos/search?${params.toString()}`, { cache:"no-store" });
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.videos || data.results || data.data || []);
      const total = Number(data.total || data.count || list.length);
      setVideos(list);
      setTotalPages(Number(data.totalPages) || Math.max(1, Math.ceil(total / Number(settings.per_page))));
    } catch {
      setVideos([]);
      setTotalPages(1);
    } finally { setLoading(false); }
  }, [query, settings, page]);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    loadVideos();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <div><span className={styles.eyebrow}>VIDEO PORTAL</span><h1>Discover Videos</h1><p>Search and browse content.</p></div>
          <a href="/admin" className={styles.adminLink}>Admin</a>
        </div>
      </header>
      <section className={styles.container}>
        <form onSubmit={submitSearch} style={{ display:"flex", gap:8, padding:"20px 0" }}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search..." style={{flex:1,minHeight:44,background:"#141414",border:"1px solid #333",borderRadius:6,color:"#fff",padding:"0 12px"}} />
          <button type="submit" style={{background:"#e50914",border:0,borderRadius:6,color:"#fff",padding:"0 20px",fontWeight:700}}>Search</button>
        </form>
        <div className={styles.settingsBar}><span>Order: <strong>{settings.order}</strong></span><span>Per page: <strong>{settings.per_page}</strong></span><span>Format: <strong>{settings.format}</strong></span></div>
        {loading ? <div className={styles.empty}>Loading...</div> : videos.length ? <VideoGrid videos={videos} onSelect={setActiveVideo} /> : <div className={styles.empty}><h2>No content available</h2><p>Configure the API endpoint and verify its response format.</p></div>}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
      <VideoModal video={activeVideo} onClose={()=>setActiveVideo(null)} />
    </main>
  );
}
