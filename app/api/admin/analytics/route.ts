import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE = "https://api.vercel.com/v1/query/web-analytics";
const DEFAULT_TEAM = "team_AMXeRqHf1n1RIJA61j2463EU";
const DEFAULT_PROJECT = "prj_7YHhwmYx70AVZqSzcOXy4I9pge2M";

type AnalyticsRow = {
  key?: string;
  pageviews?: number;
  visitors?: number;
  count?: number;
  groups?: Record<string, string>;
  [key: string]: unknown;
};

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value || 0);
}

async function queryVercel(path: string, params: Record<string, string>) {
  const token = process.env.VERCEL_ANALYTICS_TOKEN || process.env.VERCEL_TOKEN;
  if (!token) throw new Error("Missing VERCEL_ANALYTICS_TOKEN (or VERCEL_TOKEN) in Vercel environment variables.");

  const url = new URL(`${API_BASE}/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data?.error?.message || data?.message || `Vercel Analytics returned HTTP ${response.status}`);
  return data;
}

function rows(data: any): AnalyticsRow[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

function classify(path: string) {
  if (path.startsWith("/movie/")) return "Movies";
  if (path.startsWith("/series/")) return "Series";
  if (path.startsWith("/anime")) return "Anime";
  return "Other";
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const range = requestUrl.searchParams.get("range") || "30";
    const days = [7, 30, 90].includes(Number(range)) ? Number(range) : 30;
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    const teamId = process.env.VERCEL_TEAM_ID || DEFAULT_TEAM;
    const projectId = process.env.VERCEL_PROJECT_ID || DEFAULT_PROJECT;
    const common = { teamId, projectId, from: from.toISOString(), to: to.toISOString(), filter: "environment eq 'production'" };

    const [pages, trend] = await Promise.all([
      queryVercel("visits/aggregate", { ...common, by: "requestPath", limit: "500" }),
      queryVercel("visits/aggregate", { ...common, by: "day", limit: "100" }),
    ]);

    const pageRows = rows(pages);
    const pathStats = pageRows
      .map((row) => {
        const path = String(row.groups?.requestPath ?? row.requestPath ?? row.key ?? "");
        return { path, type: classify(path), pageviews: numberValue(row.pageviews), visitors: numberValue(row.visitors) };
      })
      .filter((row) => row.path.startsWith("/"))
      .sort((a, b) => b.pageviews - a.pageviews);

    const category = ["Movies", "Series", "Anime"].map((name) => ({
      name,
      pageviews: pathStats.filter((row) => row.type === name).reduce((sum, row) => sum + row.pageviews, 0),
      visitors: pathStats.filter((row) => row.type === name).reduce((sum, row) => sum + row.visitors, 0),
      pages: pathStats.filter((row) => row.type === name).length,
    }));

    const trendRows = rows(trend).map((row) => ({
      date: String(row.groups?.day ?? row.day ?? row.key ?? ""),
      pageviews: numberValue(row.pageviews),
      visitors: numberValue(row.visitors),
    }));

    const totals: { pageviews: number; visitors: number } = { pageviews: 0, visitors: 0 };
    for (const row of pageRows) {
      totals.pageviews += numberValue(row.pageviews);
      totals.visitors += numberValue(row.visitors);
    }

    return NextResponse.json({ ok: true, range: days, totals, categories: category, topPages: pathStats.slice(0, 100), trend: trendRows, source: "Vercel Web Analytics", note: "Vercel Web Analytics aggregates production traffic; visitor totals in grouped rows can repeat across days." });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Analytics unavailable" }, { status: 503 });
  }
}
