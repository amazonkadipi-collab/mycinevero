"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Settings = { adsense: boolean; display300x250: boolean; inPagePush: boolean };
const initial: Settings = { adsense: true, display300x250: true, inPagePush: false };

export default function AdsSettingsPanel() {
  const [settings, setSettings] = useState<Settings>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/ads-settings", { cache: "no-store" })
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Could not load settings"); return data as Settings; })
      .then(data => { if (active) setSettings(data); })
      .catch(error => { if (active) setMessage(error instanceof Error ? error.message : "Could not load settings"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/ads-settings", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save settings");
      setSettings(data); setMessage("Saved. Changes may take a page refresh to apply.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save settings");
    } finally { setSaving(false); }
  }

  const options: { key: keyof Settings; title: string; description: string }[] = [
    { key: "adsense", title: "Google AdSense", description: "Allow the AdSense loader and AdSense display units." },
    { key: "display300x250", title: "300 × 250 display units", description: "Show display ad placements on supported movie and series detail pages." },
    { key: "inPagePush", title: "Adsterra In-Page Push", description: "Allow the site-wide Adsterra script. This format may behave differently across browsers and devices." },
  ];

  return <main className="min-h-screen bg-[#08080f] px-4 py-10 text-white sm:px-8">
    <div className="mx-auto max-w-3xl">
      <Link href="/admin" className="text-sm font-semibold text-[#b8aaff] hover:text-white">← Back to dashboard</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-[#9d83ff]">Control center</p>
      <h1 className="mt-2 text-3xl font-black">Advertising settings</h1>
      <p className="mt-3 text-sm leading-6 text-[#9996a9]">These switches save to Supabase. They control script loading and placements; they cannot guarantee an ad network will fill an impression.</p>
      <div className="mt-8 space-y-4">
        {options.map(option => <label key={option.key} className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-[#11111f] p-5">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-violet-500" checked={settings[option.key]} disabled={loading || saving} onChange={e => setSettings(current => ({ ...current, [option.key]: e.target.checked }))} />
          <span><span className="block font-bold">{option.title}</span><span className="mt-1 block text-sm text-[#9996a9]">{option.description}</span></span>
        </label>)}
      </div>
      <button onClick={save} disabled={loading || saving} className="mt-6 rounded-xl bg-[#7751ff] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Loading…" : saving ? "Saving…" : "Save settings"}</button>
      {message && <p role="status" className="mt-4 rounded-xl border border-white/10 bg-[#11111f] p-4 text-sm">{message}</p>}
      <p className="mt-6 text-xs leading-5 text-[#777389]">If saving fails, check the production Supabase migration and Vercel environment variables. Ad settings are restricted by the existing admin-session middleware.</p>
    </div>
  </main>;
}
