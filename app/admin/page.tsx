'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, LogIn, LogOut, RefreshCw, Save, Search, Server, Settings2, SlidersHorizontal } from 'lucide-react';

type Settings = {
  query: string; order: string; per_page: number | ''; thumbsize: string; gay: number | ''; lq: number | ''; format: string;
  method: string; video_id: string; api_base_url: string; api_search_path: string; api_details_path: string;
  api_timeout_ms: number | ''; api_format: string; items_per_page: number | ''; cache_duration: number | '';
};

const EMPTY: Settings = {
  query: 'all', order: 'latest', per_page: 24, thumbsize: 'medium', gay: 0, lq: 1, format: 'json', method: 'search', video_id: '',
  api_base_url: 'https://www.eporner.com/api/v2', api_search_path: '/video/search', api_details_path: '/video/id',
  api_timeout_ms: 10000, api_format: 'json', items_per_page: 24, cache_duration: 0,
};
const ORDERS = ['latest', 'longest', 'shortest', 'top-rated', 'most-popular', 'top-weekly', 'top-monthly'];
const PAGES = [12, 24, 48, 96];
const THUMBS = ['small', 'medium', 'big'];
const FILTERS = [0, 1, 2];
const FORMATS = ['json', 'xml'];
const METHODS = ['search', 'id', 'removed'];
const CACHE = [0, 60, 300, 3600];
const TIMEOUTS = [5000, 10000, 15000, 30000, 60000];

const inputClass = 'w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/70 focus:bg-black/30 focus:ring-2 focus:ring-red-500/10';
const selectClass = `${inputClass} cursor-pointer appearance-none`;

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState<Settings>(EMPTY);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/login', { cache: 'no-store' }).then(r => r.json()).then(d => setAuthenticated(Boolean(d.authenticated))).catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => { if (authenticated) loadSettings(); }, [authenticated]);

  async function loadSettings() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/settings', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load settings.');
      setSettings({ ...EMPTY, ...(data.settings || {}) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load settings.'); }
    finally { setLoading(false); }
  }

  function update(key: keyof Settings, value: string | number) {
    setSettings(current => ({ ...current, [key]: value })); setMessage(''); setError('');
  }

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid credentials');
      setUsername(''); setPassword(''); setAuthenticated(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Invalid credentials'); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' }); setAuthenticated(false); setSettings(EMPTY);
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save settings.');
      setSettings({ ...EMPTY, ...(data.settings || {}) }); setMessage('All settings saved successfully!');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save settings.'); }
    finally { setBusy(false); }
  }

  const header = (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/15 ring-1 ring-red-500/20"><Settings2 className="h-4 w-4 text-red-400" /></div><div><div className="text-sm font-black tracking-[0.18em] text-white">ADMIN</div><div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Complete API Settings</div></div></div>
        {authenticated && <div className="flex items-center gap-2"><Link href="/" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white sm:flex"><ArrowLeft className="h-3.5 w-3.5" /> Portal</Link><button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300"><LogOut className="h-3.5 w-3.5" /> Logout</button></div>}
      </div>
    </header>
  );

  if (authenticated === null) return <div className="min-h-screen bg-[#0a0a0a]" />;

  if (!authenticated) return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">{header}<main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12"><form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl shadow-black/40"><div className="mb-7 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/10 ring-1 ring-red-500/20"><KeyRound className="h-6 w-6 text-red-400" /></div><h1 className="text-2xl font-bold text-white">Admin Dashboard</h1><p className="mt-2 text-sm text-zinc-500">Sign in to manage all API settings.</p></div><div className="space-y-4"><Field label="Username"><input required value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" autoComplete="username" className={inputClass} /></Field><Field label="Password"><input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" autoComplete="current-password" className={inputClass} /></Field></div><button disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50"><LogIn className="h-4 w-4" />{busy ? 'Signing in…' : 'Sign in'}</button>{error && <Alert text={error} />}</form></main></div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">{header}
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-8"><div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-red-400">Elovex Administration</div><h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Site & API Settings</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">Manage Elovex content discovery, provider connection, and display settings from one place.</p></div>
        {loading && <div className="mb-5 flex items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-zinc-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading saved settings…</div>}
        {message && <Alert success text={message} />}{error && <Alert text={error} />}
        <form onSubmit={save} className="space-y-5">
          <Section icon={<Search />} number="01" title="Search Settings" description="Main search parameters sent to the configured provider."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Search Query" full><input value={settings.query} onChange={e => update('query', e.target.value)} placeholder="Enter search query..." className={inputClass} /></Field><Field label="Order"><Select value={settings.order} placeholder="Select order..." options={ORDERS} onChange={v => update('order', v)} /></Field><Field label="Per Page"><Select value={settings.per_page} placeholder="Select per page..." options={PAGES} onChange={v => update('per_page', v === '' ? '' : Number(v))} /></Field><Field label="Thumb Size"><Select value={settings.thumbsize} placeholder="Select thumb size..." options={THUMBS} onChange={v => update('thumbsize', v)} /></Field><Field label="Filter Option A"><Select value={settings.gay} placeholder="Select option..." options={FILTERS} onChange={v => update('gay', v === '' ? '' : Number(v))} /></Field><Field label="Filter Option B"><Select value={settings.lq} placeholder="Select option..." options={FILTERS} onChange={v => update('lq', v === '' ? '' : Number(v))} /></Field><Field label="Response Format"><Select value={settings.format} placeholder="Select format..." options={FORMATS} onChange={v => update('format', v)} /></Field></div></Section>
          <Section icon={<SlidersHorizontal />} number="02" title="API Methods" description="Select how the application calls the provider and which identifier it uses."><div className="grid gap-4 sm:grid-cols-2"><Field label="API Method"><Select value={settings.method} placeholder="Select method..." options={METHODS} onChange={v => update('method', v)} /></Field><Field label="Video ID"><input value={settings.video_id} onChange={e => update('video_id', e.target.value)} placeholder="Enter video ID..." className={inputClass} /></Field></div></Section>
          <Section icon={<Server />} number="03" title="API Configuration" description="Full connection, endpoint and response configuration. These fields are now editable from Admin."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="API Base URL" full><input type="url" value={settings.api_base_url} onChange={e => update('api_base_url', e.target.value)} placeholder="https://example.com/api/v2/" className={inputClass} /></Field><Field label="Search Path"><input value={settings.api_search_path} onChange={e => update('api_search_path', e.target.value)} placeholder="/search" className={inputClass} /></Field><Field label="Details Path"><input value={settings.api_details_path} onChange={e => update('api_details_path', e.target.value)} placeholder="/details" className={inputClass} /></Field><Field label="API Timeout"><Select value={settings.api_timeout_ms} placeholder="Select timeout..." options={TIMEOUTS} suffix=" ms" onChange={v => update('api_timeout_ms', v === '' ? '' : Number(v))} /></Field><Field label="API Response Format"><Select value={settings.api_format} placeholder="Select format..." options={FORMATS} onChange={v => update('api_format', v)} /></Field><Field label="Items Per Page"><Select value={settings.items_per_page} placeholder="Select items per page..." options={PAGES} onChange={v => update('items_per_page', v === '' ? '' : Number(v))} /></Field><Field label="Cache Duration"><Select value={settings.cache_duration} placeholder="Select cache duration (seconds)..." options={CACHE} suffix=" seconds" onChange={v => update('cache_duration', v === '' ? '' : Number(v))} /></Field></div></Section>
          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-zinc-600">All configurable portal/API settings are managed from this page and saved to Supabase.</p><div className="flex gap-2"><button type="button" onClick={loadSettings} disabled={busy || loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Reload</button><button type="submit" disabled={busy || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 hover:bg-red-500 disabled:opacity-50"><Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save All Settings'}</button></div></div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) { return <div className={`flex flex-col gap-2 ${full ? 'sm:col-span-2 lg:col-span-3' : ''}`}><label className="text-xs font-semibold text-zinc-300">{label}</label>{children}</div>; }
function Select({ value, placeholder, options, onChange, suffix = '' }: { value: string | number; placeholder: string; options: Array<string | number>; onChange: (value: string) => void; suffix?: string }) { return <div className="relative"><select value={value} onChange={e => onChange(e.target.value)} className={selectClass}><option value="" disabled>{placeholder}</option>{options.map(o => <option key={String(o)} value={String(o)}>{String(o)}{suffix}</option>)}</select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">⌄</span></div>; }
function Section({ icon, number, title, description, children }: { icon: ReactNode; number: string; title: string; description: string; children: ReactNode }) { return <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-xl shadow-black/10"><div className="border-b border-white/10 px-5 py-5 sm:px-6"><div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10 text-red-400 ring-1 ring-red-500/20">{icon}</div><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400">Section {number}</div><h2 className="mt-1 text-lg font-bold text-white">{title}</h2><p className="mt-1 text-sm text-zinc-500">{description}</p></div></div></div><div className="p-5 sm:p-6">{children}</div></section>; }
function Alert({ text, success = false }: { text: string; success?: boolean }) { return <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${success ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-red-500/20 bg-red-500/5 text-red-300'}`}>{text}</div>; }
