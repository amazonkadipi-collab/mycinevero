import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE = "https://api.vercel.com/v1/query/web-analytics";
const DEFAULT_TEAM = "team_AMXeRqHf1n1RIJA61j2463EU";
const DEFAULT_PROJECT = "prj_7YHhwmYx70AVZqSzcOXy4I9pge2M";

type AnalyticsRow = Record<string, unknown> & { pageviews?: number; visitors?: number; count?: number; groups?: Record<string, string> };
function num(v: unknown) { return typeof v === "number" && Number.isFinite(v) ? v : Number(v || 0); }
function rows(data: any): AnalyticsRow[] { if (Array.isArray(data)) return data; if (Array.isArray(data?.data)) return data.data; if (Array.isArray(data?.result)) return data.result; return []; }
function value(row: AnalyticsRow, dimension: string) { return String(row[dimension] ?? row.groups?.[dimension] ?? row.key ?? "Unknown"); }
function classify(path: string) { if (path.startsWith("/movie/")) return "Movies"; if (path.startsWith("/series/")) return "Series"; if (path.startsWith("/anime")) return "Anime"; return "Other"; }

async function queryVercel(path: string, params: Record<string, string>) {
  const token = process.env.VERCEL_ANALYTICS_TOKEN || process.env.VERCEL_TOKEN;
  if (!token) throw new Error("Missing VERCEL_ANALYTICS_TOKEN (or VERCEL_TOKEN) in Vercel environment variables.");
  const url = new URL(`${API_BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data?.error?.message || data?.message || `Vercel Analytics returned HTTP ${response.status}`);
  return data;
}

async function aggregate(by: string, common: Record<string, string>, limit = "10") {
  const data = await queryVercel("visits/aggregate", { ...common, by, limit });
  return rows(data).map(row => ({ name: value(row, by), pageviews: num(row.pageviews), visitors: num(row.visitors) })).sort((a, b) => b.pageviews - a.pageviews);
}

export async function GET(request: Request) {
  try {
    const u = new URL(request.url);
    const requested = Number(u.searchParams.get("range") || "30");
    const days = [7, 30, 90].includes(requested) ? requested : 30;
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    const common = { teamId: process.env.VERCEL_TEAM_ID || DEFAULT_TEAM, projectId: process.env.VERCEL_PROJECT_ID || DEFAULT_PROJECT, since: from.toISOString(), until: to.toISOString(), filter: "environment eq 'production'" };

    const [totals, pages, trend, country, referrers, browsers, devices] = await Promise.all([
      queryVercel("visits/count", common),
      queryVercel("visits/aggregate", { ...common, by: "requestPath", limit: "100" }),
      queryVercel("visits/aggregate", { ...common, by: "day", limit: "100" }),
      aggregate("country", common, "25"),
      aggregate("referrerHostname", common, "25"),
      aggregate("browserName", common, "15"),
      aggregate("deviceType", common, "10"),
    ]);

    const pageRows = rows(pages).map(row => {
      const path = String(row.groups?.requestPath ?? row.requestPath ?? row.key ?? "");
      return { path, type: classify(path), pageviews: num(row.pageviews), visitors: num(row.visitors) };
    }).filter(x => x.path.startsWith("/")).sort((a, b) => b.pageviews - a.pageviews);

    const categories = ["Movies", "Series", "Anime"].map(name => {
      const matching = pageRows.filter(x => x.type === name);
      return { name, pageviews: matching.reduce((s, x) => s + x.pageviews, 0), visitors: matching.reduce((s, x) => s + x.visitors, 0), pages: matching.length };
    });

    const trendRows = rows(trend).map(row => ({ date: String(row.groups?.day ?? row.day ?? row.key ?? ""), pageviews: num(row.pageviews), visitors: num(row.visitors) }));
    const totalData = totals?.data || totals?.result || {};
    const totalPageviews = num(totalData.pageviews);
    const totalVisitors = num(totalData.visitors);

    return NextResponse.json({ ok: true, range: days, source: "Vercel Web Analytics", totals: { pageviews: totalPageviews, visitors: totalVisitors }, categories, topPages: pageRows.slice(0, 100), trend: trendRows, country, referrers, browsers, devices, note: "Visitor totals come from the production count endpoint. Country, referrer, browser and device values are aggregated Web Analytics dimensions; no individual identity is exposed here." });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Analytics unavailable" }, { status: 503 });
  }
}
