import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVER_KEY = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

function uaInfo(ua: string) {
  const value = ua.toLowerCase();
  const browser = value.includes('edg/') ? 'Edge' : value.includes('opr/') || value.includes('opera') ? 'Opera' : value.includes('chrome/') ? 'Chrome' : value.includes('firefox/') ? 'Firefox' : value.includes('safari/') && !value.includes('chrome/') ? 'Safari' : value.includes('msie') || value.includes('trident/') ? 'Internet Explorer' : 'Other';
  const os = value.includes('windows') ? 'Windows' : value.includes('android') ? 'Android' : value.includes('iphone') || value.includes('ipad') || value.includes('ios') ? 'iOS' : value.includes('mac os') ? 'macOS' : value.includes('linux') ? 'Linux' : 'Other';
  const device = value.includes('ipad') || value.includes('tablet') ? 'Tablet' : value.includes('mobile') || value.includes('iphone') || value.includes('android') ? 'Mobile' : 'Desktop';
  const bot = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse/i.test(ua);
  return { browser, os, device, bot };
}

function getClientIp(headers: Headers) {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || '';
}

export async function recordAnalytics(request: Request, input: { path?: string; referrer?: string }) {
  if (!SUPABASE_URL || !SUPABASE_SERVER_KEY) return;
  const headers = request.headers;
  const userAgent = headers.get('user-agent')?.slice(0, 1000) || '';
  const { browser, os, device, bot } = uaInfo(userAgent);
  const ip = getClientIp(headers);
  const secret = process.env.ANALYTICS_HASH_SECRET?.trim() || SUPABASE_SERVER_KEY;
  const visitorHash = ip ? crypto.createHash('sha256').update(`${secret}:${ip}`).digest('hex') : null;
  const row = {
    path: String(input.path || '/').slice(0, 500),
    referrer: String(input.referrer || '').slice(0, 1000) || null,
    country: headers.get('x-vercel-ip-country')?.slice(0, 100) || null,
    country_code: headers.get('x-vercel-ip-country')?.slice(0, 10) || null,
    region: headers.get('x-vercel-ip-country-region')?.slice(0, 100) || null,
    city: headers.get('x-vercel-ip-city')?.slice(0, 150) || null,
    device, browser, os, user_agent: userAgent || null, visitor_hash: visitorHash, is_bot: bot,
  };
  await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
    method: 'POST', cache: 'no-store', headers: { apikey: SUPABASE_SERVER_KEY, Authorization: `Bearer ${SUPABASE_SERVER_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
}

export async function analyticsQuery(path: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVER_KEY) throw new Error('Supabase is not configured');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { cache: 'no-store', headers: { apikey: SUPABASE_SERVER_KEY, Authorization: `Bearer ${SUPABASE_SERVER_KEY}` } });
  if (!response.ok) throw new Error(`Analytics query failed (${response.status})`);
  return response.json();
}
