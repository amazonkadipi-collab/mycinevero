"use client";

import { useMemo, useState } from "react";

const SITE_URL = "https://cinevero.vercel.app";

const defaultUrls = `${SITE_URL}/\n${SITE_URL}/discover\n${SITE_URL}/movie\n${SITE_URL}/series\n${SITE_URL}/anime\n${SITE_URL}/genres`;

type Inspection = {
  ok: boolean;
  url: string;
  verdict?: string | null;
  coverageState?: string | null;
  indexingState?: string | null;
  robotsTxtState?: string | null;
  pageFetchState?: string | null;
  lastCrawlTime?: string | null;
  googleCanonical?: string | null;
  inspectionResultLink?: string | null;
  error?: string;
};

export default function IndexingDashboard() {
  const [value, setValue] = useState(defaultUrls);
  const [results, setResults] = useState<Inspection[]>([]);
  const [busy, setBusy] = useState<"inspect" | "indexnow" | null>(null);
  const [message, setMessage] = useState("");

  const urls = useMemo(
    () => Array.from(new Set(value.split(/\r?\n|,/).map((url) => url.trim()).filter(Boolean))),
    [value],
  );

  async function inspect() {
    setBusy("inspect");
    setMessage("");
    try {
      const response = await fetch("/api/admin/indexing/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Inspection failed");
      setResults(data.results || []);
      setMessage(`Google inspection completed for ${data.results?.length || 0} URL(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Inspection failed");
    } finally {
      setBusy(null);
    }
  }

  async function submitIndexNow() {
    setBusy("indexnow");
    setMessage("");
    try {
      const response = await fetch("/api/admin/indexing/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "IndexNow submission failed");
      setMessage(`IndexNow accepted ${data.submitted} URL(s). This is a signal, not an indexing guarantee.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "IndexNow submission failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--cinevero-bg)] px-4 py-8 text-[var(--cinevero-text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-[var(--cinevero-border)] bg-white p-6 shadow-sm">
          <div className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--cinevero-ocean)]">Cinevero Admin</div>
          <h1 className="text-3xl font-black tracking-tight">Indexing Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--cinevero-muted)]">
            Inspect Google indexing status, send URL-change signals through IndexNow, and open the official Google inspection result.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-3xl border border-[var(--cinevero-border)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">URLs</h2>
              <span className="rounded-full bg-[var(--cinevero-sky)] px-3 py-1 text-xs font-bold text-[var(--cinevero-ocean)]">{urls.length} URLs</span>
            </div>
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              rows={12}
              spellCheck={false}
              className="w-full rounded-2xl border border-[var(--cinevero-border)] bg-[var(--cinevero-soft)] p-4 font-mono text-sm outline-none focus:border-[var(--cinevero-ocean)]"
              placeholder="One Cinevero URL per line"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={inspect}
                disabled={busy !== null || !urls.length}
                className="rounded-2xl bg-[var(--cinevero-ocean)] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "inspect" ? "Inspecting…" : "Inspect Google"}
              </button>
              <button
                type="button"
                onClick={submitIndexNow}
                disabled={busy !== null || !urls.length}
                className="rounded-2xl bg-[var(--cinevero-accent)] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "indexnow" ? "Submitting…" : "Send IndexNow"}
              </button>
              <a
                href="https://search.google.com/search-console?resource_id=https%3A%2F%2Fcinevero.vercel.app%2F"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-[var(--cinevero-border)] bg-white px-5 py-3 text-sm font-extrabold"
              >
                Open Search Console
              </a>
            </div>
            {message && <div className="mt-4 rounded-2xl bg-[var(--cinevero-sand)] p-3 text-sm font-semibold">{message}</div>}
          </div>

          <aside className="rounded-3xl border border-[var(--cinevero-border)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">What each action does</h2>
            <div className="mt-4 space-y-4 text-sm leading-6 text-[var(--cinevero-muted)]">
              <div><b className="text-[var(--cinevero-text)]">Inspect Google</b><br />Reads Google Search Console&apos;s URL Inspection result: index verdict, coverage, robots, noindex, fetch state, canonical and last crawl.</div>
              <div><b className="text-[var(--cinevero-text)]">Send IndexNow</b><br />Sends URL-change notifications to IndexNow-participating search engines. It does not guarantee indexing.</div>
              <div><b className="text-[var(--cinevero-text)]">Google indexing</b><br />Google&apos;s URL Inspection API lets the dashboard inspect status; it is not a generic API for forcing a movie URL into Google&apos;s index.</div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-[var(--cinevero-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">Inspection results</h2>
            <span className="text-xs font-semibold text-[var(--cinevero-muted)]">Google Search Console</span>
          </div>
          {!results.length ? (
            <div className="rounded-2xl bg-[var(--cinevero-soft)] p-6 text-sm text-[var(--cinevero-muted)]">Run an inspection to see Google&apos;s current data.</div>
          ) : (
            <div className="space-y-3">
              {results.map((item) => (
                <article key={item.url} className="rounded-2xl border border-[var(--cinevero-border)] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="break-all font-mono text-sm font-bold">{item.url}</div>
                      {item.ok ? (
                        <div className="mt-2 grid gap-2 text-xs text-[var(--cinevero-muted)] sm:grid-cols-2 lg:grid-cols-4">
                          <span><b>Verdict:</b> {item.verdict || "—"}</span>
                          <span><b>Coverage:</b> {item.coverageState || "—"}</span>
                          <span><b>Indexing:</b> {item.indexingState || "—"}</span>
                          <span><b>Fetch:</b> {item.pageFetchState || "—"}</span>
                          <span><b>Robots:</b> {item.robotsTxtState || "—"}</span>
                          <span><b>Last crawl:</b> {item.lastCrawlTime ? new Date(item.lastCrawlTime).toLocaleString() : "—"}</span>
                          <span className="sm:col-span-2"><b>Canonical:</b> {item.googleCanonical || "—"}</span>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm font-semibold text-[var(--cinevero-accent-dark)]">{item.error}</div>
                      )}
                    </div>
                    {item.inspectionResultLink && (
                      <a href={item.inspectionResultLink} target="_blank" rel="noreferrer" className="shrink-0 rounded-xl bg-[var(--cinevero-sky)] px-3 py-2 text-xs font-extrabold text-[var(--cinevero-ocean)]">
                        Google details ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
