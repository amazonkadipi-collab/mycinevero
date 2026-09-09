"use client";

import { useEffect, useState } from "react";
import styles from "../../styles/Admin.module.css";

const DEFAULT_SETTINGS = { query:"all", order:"latest", per_page:24, thumbsize:"medium", gay:0, lq:1, format:"json" };

export default function AdminPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings", { cache:"no-store" }).then(async r => {
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || "Failed to load settings.");
      setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    }).catch(e => setError(e.message || "Failed to load settings.")).finally(() => setLoading(false));
  }, []);

  const update = (key, value) => { setSettings(s => ({...s,[key]:value})); setMessage(""); setError(""); };

  async function save(event) {
    event.preventDefault(); setSaving(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...settings,per_page:Number(settings.per_page),gay:Number(settings.gay),lq:Number(settings.lq)}) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to save settings.");
      setSettings(data.settings); setMessage("Settings saved successfully!");
    } catch(e) { setError(e.message || "Failed to save settings."); } finally { setSaving(false); }
  }

  if (loading) return <main className={styles.page}><div className={styles.container}><div className={styles.loading}>Loading settings...</div></div></main>;

  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><span className={styles.eyebrow}>ADMIN DASHBOARD</span><h1>Settings</h1><p>Configure the content API and homepage behavior.</p></header>
    <form onSubmit={save} className={styles.card}><div className={styles.grid}>
      <div className={styles.field}><label htmlFor="query">Search Query</label><input id="query" value={settings.query} onChange={e=>update("query",e.target.value)} /></div>
      <div className={styles.field}><label htmlFor="order">Order</label><select id="order" value={settings.order} onChange={e=>update("order",e.target.value)}>{["latest","longest","shortest","top-rated","most-popular","top-weekly","top-monthly"].map(v=><option key={v} value={v}>{v}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="per_page">Per Page</label><select id="per_page" value={settings.per_page} onChange={e=>update("per_page",Number(e.target.value))}>{[12,24,48,96].map(v=><option key={v} value={v}>{v}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="thumbsize">Thumb Size</label><select id="thumbsize" value={settings.thumbsize} onChange={e=>update("thumbsize",e.target.value)}>{["small","medium","big"].map(v=><option key={v} value={v}>{v}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="gay">Gay Content</label><select id="gay" value={settings.gay} onChange={e=>update("gay",Number(e.target.value))}><option value={0}>0 — Exclude</option><option value={1}>1 — Include</option><option value={2}>2 — Only</option></select></div>
      <div className={styles.field}><label htmlFor="lq">Low Quality</label><select id="lq" value={settings.lq} onChange={e=>update("lq",Number(e.target.value))}><option value={0}>0 — Exclude</option><option value={1}>1 — Include</option><option value={2}>2 — Only</option></select></div>
      <div className={styles.field}><label htmlFor="format">Format</label><select id="format" value={settings.format} onChange={e=>update("format",e.target.value)}><option value="json">JSON</option><option value="xml">XML</option></select></div>
    </div>{message && <div className={styles.success}>{message}</div>}{error && <div className={styles.error}>{error}</div>}<div className={styles.actions}><button disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button></div></form>
  </div></main>;
}
