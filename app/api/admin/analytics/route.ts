import { NextRequest, NextResponse } from 'next/server';
import { analyticsQuery } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
const ADMIN_COOKIE = 'elovex_admin';
function isAdmin(request: NextRequest) { return request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'; }

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const daysRaw = Number(request.nextUrl.searchParams.get('days') || 30);
    const days = Number.isInteger(daysRaw) ? Math.min(90, Math.max(1, daysRaw)) : 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const filter = `created_at=gte.${encodeURIComponent(since)}&is_bot=eq.false`;
    const [summary, countries, devices, browsers, operatingSystems, pages, referrers, daily] = await Promise.all([
      analyticsQuery(`analytics_events?select=id,visitor_hash&${filter}`),
      analyticsQuery(`analytics_events?select=country,country_code&${filter}&order=country_code.asc&limit=50000`),
      analyticsQuery(`analytics_events?select=device&${filter}&order=device.asc&limit=50000`),
      analyticsQuery(`analytics_events?select=browser&${filter}&order=browser.asc&limit=50000`),
      analyticsQuery(`analytics_events?select=os&${filter}&order=os.asc&limit=50000`),
      analyticsQuery(`analytics_events?select=path&${filter}&order=created_at.desc&limit=50000`),
      analyticsQuery(`analytics_events?select=referrer&${filter}&order=created_at.desc&limit=50000`),
      analyticsQuery(`analytics_events?select=created_at,visitor_hash&${filter}&order=created_at.asc&limit=50000`),
    ]);
    const countBy = (rows: Record<string, unknown>[], key: string) => Object.entries(rows.reduce<Record<string, number>>((a, r) => { const k = String(r[key] || 'Unknown'); a[k] = (a[k] || 0) + 1; return a; }, {})).sort((a,b) => b[1]-a[1]).slice(0, 15).map(([name,count]) => ({ name, count }))
    const unique = new Set((summary as { visitor_hash?: string | null }[]).map(r => r.visitor_hash).filter(Boolean)).size;
    const daysMap = (daily as { created_at: string }[]).reduce<Record<string, number>>((a,r) => { const d = r.created_at.slice(0,10); a[d]=(a[d]||0)+1; return a; }, {});
    const dailyVisitors = Object.entries(daysMap).map(([date,views]) => ({ date, views })).sort((a,b)=>a.date.localeCompare(b.date));
    return NextResponse.json({ success:true, periodDays:days, pageViews:summary.length, uniqueVisitors:unique, countries:countBy(countries,'country'), devices:countBy(devices,'device'), browsers:countBy(browsers,'browser'), operatingSystems:countBy(operatingSystems,'os'), pages:countBy(pages,'path'), referrers:countBy(referrers,'referrer'), dailyVisitors });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load analytics' }, { status: 500 }); }
}
