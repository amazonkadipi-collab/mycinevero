const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVER_KEY = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export type PortalSettings = {
  query: string;
  order: string;
  per_page: number | '';
  thumbsize: string;
  gay: number | '';
  lq: number | '';
  format: 'json' | 'xml' | '';
  method: string;
  video_id: string;
  api_base_url: string;
  api_search_path: string;
  api_details_path: string;
  api_timeout_ms: number | '';
  api_format: 'json' | 'xml' | '';
  items_per_page: number | '';
  cache_duration: number | '';
};

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  query: 'all', order: 'latest', per_page: 24, thumbsize: 'medium', gay: 0, lq: 1, format: 'json',
  method: 'search', video_id: '', api_base_url: 'https://www.eporner.com/api/v2', api_search_path: '/video/search', api_details_path: '/video/id',
  api_timeout_ms: 10000, api_format: 'json', items_per_page: 24, cache_duration: 0,
};

const KEYS = Object.keys(DEFAULT_PORTAL_SETTINGS) as (keyof PortalSettings)[];
const TEXT_KEYS = new Set<keyof PortalSettings>([
  'query','order','thumbsize','format','method','video_id','api_base_url','api_search_path','api_details_path','api_format',
]);

async function supabaseRequest(path: string, init?: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVER_KEY) throw new Error('Supabase is not configured');
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init, cache: 'no-store',
    headers: { apikey: SUPABASE_SERVER_KEY, Authorization: `Bearer ${SUPABASE_SERVER_KEY}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
}

function parseRows(rows: { key: string; value: string }[]) {
  const settings: Partial<PortalSettings> = {};
  for (const row of rows) {
    const key = row.key.replace(/^elovex_/, '') as keyof PortalSettings;
    if (!KEYS.includes(key)) continue;
    settings[key] = (TEXT_KEYS.has(key) ? row.value : (row.value === '' ? '' : Number(row.value))) as never;
  }
  return settings;
}

export async function getPortalSettings(): Promise<PortalSettings> {
  if (!SUPABASE_URL || !SUPABASE_SERVER_KEY) return { ...DEFAULT_PORTAL_SETTINGS };
  try {
    const response = await supabaseRequest('site_settings?select=key,value&key=like.elovex_*');
    if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}`);
    const rows = (await response.json()) as { key: string; value: string }[];
    const saved = parseRows(rows);
    for (const key of Object.keys(saved) as (keyof PortalSettings)[]) {
      if (saved[key] === '') delete saved[key];
    }
    return { ...DEFAULT_PORTAL_SETTINGS, ...saved } as PortalSettings;
  } catch {
    return { ...DEFAULT_PORTAL_SETTINGS };
  }
}

/** Returns only explicitly saved portal values; missing keys stay empty for the Admin UI. */
export async function getSavedPortalSettings(): Promise<Partial<PortalSettings>> {
  if (!SUPABASE_URL || !SUPABASE_SERVER_KEY) return {};
  try {
    const response = await supabaseRequest('site_settings?select=key,value&key=like.elovex_*');
    if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}`);
    const rows = (await response.json()) as { key: string; value: string }[];
    return parseRows(rows);
  } catch {
    return {};
  }
}

export async function savePortalSettings(settings: PortalSettings) {
  if (!SUPABASE_URL || !SUPABASE_SERVER_KEY) throw new Error('Supabase is not configured. Add SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel.');
  const rows = KEYS.map((key) => ({
    key: `elovex_${key}`, value: String(settings[key]), value_type: typeof settings[key] === 'number' ? 'number' : 'text',
    description: `Elovex portal setting: ${key}`, updated_by: 'admin', updated_at: new Date().toISOString(),
  }));
  const response = await supabaseRequest('site_settings?on_conflict=key', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows),
  });
  if (!response.ok) { const detail = await response.text(); throw new Error(`Could not save settings (${response.status}): ${detail.slice(0, 300)}`); }
  return settings;
}
