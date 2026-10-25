import { NextResponse } from 'next/server';
import { defaultAdsSettings, type AdsSettings } from '@/lib/ads-settings';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json(defaultAdsSettings, { headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?key=eq.ads&select=value&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Settings read failed: HTTP ${response.status}`);
    const rows = await response.json() as Array<{ value?: Partial<AdsSettings> }>;
    const value = rows[0]?.value;
    const settings: AdsSettings = value ? {
      adsense: value.adsense === true,
      display300x250: value.display300x250 === true,
      inPagePush: value.inPagePush === true,
    } : defaultAdsSettings;
    return NextResponse.json(settings, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[ads-settings] Read failed', error instanceof Error ? error.message : String(error));
    // Fail closed: a settings/database failure should not inject ads unexpectedly.
    return NextResponse.json({ adsense: false, display300x250: false, inPagePush: false }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
