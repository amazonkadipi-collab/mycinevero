'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  Globe2,
  KeyRound,
  LogIn,
  LogOut,
  Network,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings2,
  SlidersHorizontal,
  Timer,
  Video,
  X,
} from 'lucide-react';

type Settings = {
  query: string;
  order: string;
  per_page: number | '';
  thumbsize: string;
  gay: number | '';
  lq: number | '';
  format: string;
  method: string;
  video_id: string;
  api_base_url: string;
  api_search_path: string;
  api_details_path: string;
  api_timeout_ms: number | '';
  api_format: string;
  items_per_page: number | '';
  cache_duration: number | '';
};

const EMPTY: Settings = {
  query: '', order: '', per_page: '', thumbsize: '', gay: '', lq: '', format: '',
  method: '', video_id: '', api_base_url: '', api_search_path: '', api_details_path: '',
  api_timeout_ms: '', api_format: '', items_per_page: '', cache_duration: '',
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
const selectClass = `${inputClass} appearance-none pr-10 cursor-pointer`;

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
    fetch('/api/admin/login', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setAuthenticated(Boolean(d.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    loadSettings();
  }, [authenticated]);

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/settings', { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load settings.');
      setSettings({ ...EMPTY, ...d.settings });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }

  const set = (key: keyof Settings, value: string | number) =>
    setSettings((current) => ({ ...current, [key]: value }));

  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Invalid credentials');
      setUsername(''); setPassword(''); setAuthenticated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid credentials');
    } finally { setBusy(false); }
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthenticated(false);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage(''); setError('');
    try {
      const r = await fetch('/api/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to save settings');
      setSettings({ ...EMPTY, ...d.settings });
      setMessage('All settings saved successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally { setBusy(false); }
  }

  const configured = useMemo(() => Boolean(settings.api_base_url && settings.api_base_url !== 'SAMPLE_API_BASE_URL'), [settings.api_base_url]);

  if (authenticated === null) return <div className="min-h-screen bg-[#09090b]" />;

  const header = (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0d]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/15 ring-1 ring-red-500/20">
            <Settings2 className="h-4.5 w-4.5 text-red-400" />
          </div>
          <div>
            <div className="text-sm font-black tracking-[0.18em] text-white">ELOVEX</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Control Center</div>
          </div>
        </div>
        {authenticated && (
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white sm:flex">
              <ArrowLeft className="h-3.5 w-3.5" /> Portal
            </Link>
            <button onClick={logout} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );

  if (!authenticated) return (
    <div className="min-h-screen bg-[#070708] text-zinc-200">
      {header}
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/10 ring-1 ring-red-500/20">
              <KeyRound className="h-6 w-6 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-zinc-500">Sign in to manage Elovex API configuration.</p>
          </div>
          <form onSubmit={login} className="rounded-2xl border border-white/10 bg-[#111113] p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="space-y-4">
              <Field label="Username"><input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" autoComplete="username" className={inputClass} /></Field>
              <Field label="Password"><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" autoComplete="current-password" className={inputClass} /></Field>
            </div>
            <button disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
              <LogIn className="h-4 w-4" /> {busy ? 'Signing in…' : 'Sign in'}
            </button>
            {error && <Alert type="error" text={error} />}
          </form>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-200">
      {header}
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-400"><Activity className="h-3.5 w-3.5" /> Administration</div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">API Settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Control search behavior, provider endpoints, response format, caching and request limits from one place.</p>
          </div>
          <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${configured ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-amber-500/20 bg-amber-500/5 text-amber-400'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {configured ? 'Provider configured' : 'Provider not configured'}
          </div>
        </div>

        {loading && <div className="mb-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading saved settings…</div>}
        {message && <Alert type="success" text={message} />}
        {error && <Alert type="error" text={error} />}

        <form onSubmit={save} className="space-y-5">
          <Section icon={<Search />} title="Search" description="Default search behavior and provider query parameters.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Search query" hint="Default query"><input value={settings.query} onChange={(e) => set('query', e.target.value)} placeholder="all" className={inputClass} /></Field>
              <Field label="Order"><Select value={settings.order} placeholder="Select order" options={ORDERS} onChange={(v) => set('order', v)} /></Field>
              <Field label="Results per page"><Select value={settings.per_page} placeholder="Select amount" options={PAGES} onChange={(v) => set('per_page', v === '' ? '' : Number(v))} /></Field>
              <Field label="Thumbnail size"><Select value={settings.thumbsize} placeholder="Select size" options={THUMBS} onChange={(v) => set('thumbsize', v)} /></Field>
              <Field label="Filter A"><Select value={settings.gay} placeholder="Select option" options={FILTERS} onChange={(v) => set('gay', v === '' ? '' : Number(v))} /></Field>
              <Field label="Filter B"><Select value={settings.lq} placeholder="Select option" options={FILTERS} onChange={(v) => set('lq', v === '' ? '' : Number(v))} /></Field>
              <Field label="Response format"><Select value={settings.format} placeholder="Select format" options={FORMATS} onChange={(v) => set('format', v)} /></Field>
              <Field label="API method"><Select value={settings.method} placeholder="Select method" options={METHODS} onChange={(v) => set('method', v)} /></Field>
            </div>
          </Section>

          <Section icon={<Server />} title="Provider connection" description="Server-side endpoint configuration. Keep provider credentials out of the browser.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="API base URL" hint="HTTP/HTTPS only" full><input type="url" value={settings.api_base_url} onChange={(e) => set('api_base_url', e.target.value)} placeholder="https://example.com/api" className={inputClass} /></Field>
              <Field label="Search path"><input value={settings.api_search_path} onChange={(e) => set('api_search_path', e.target.value)} placeholder="/search" className={inputClass} /></Field>
              <Field label="Details path"><input value={settings.api_details_path} onChange={(e) => set('api_details_path', e.target.value)} placeholder="/details" className={inputClass} /></Field>
              <Field label="Provider format"><Select value={settings.api_format} placeholder="Select format" options={FORMATS} onChange={(v) => set('api_format', v)} /></Field>
              <Field label="Request timeout"><Select value={settings.api_timeout_ms} placeholder="Select timeout" options={TIMEOUTS} suffix="ms" onChange={(v) => set('api_timeout_ms', v === '' ? '' : Number(v))} /></Field>
            </div>
          </Section>

          <Section icon={<SlidersHorizontal />} title="Delivery & caching" description="Tune result volume and cache behavior without changing application code.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Items per page"><Select value={settings.items_per_page} placeholder="Select amount" options={PAGES} onChange={(v) => set('items_per_page', v === '' ? '' : Number(v))} /></Field>
              <Field label="Cache duration"><Select value={settings.cache_duration} placeholder="Select duration" options={CACHE} suffix="sec" onChange={(v) => set('cache_duration', v === '' ? '' : Number(v))} /></Field>
              <Field label="Video ID" hint="Used by ID method" full><input value={settings.video_id} onChange={(e) => set('video_id', e.target.value)} placeholder="Optional video ID" className={inputClass} /></Field>
            </div>
          </Section>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-600"><Network className="h-3.5 w-3.5" /> Changes are persisted in the site settings store.</div>
            <div className="flex gap-2">
              <button type="button" onClick={loadSettings} disabled={busy || loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Reload</button>
              <button disabled={busy || loading} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save changes'}</button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, hint, children, full = false }: { label: string; hint?: string; children: React.ReactNode; full?: boolean }) {
  return <label className={full ? 'sm:col-span-2' : ''}><span className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-zinc-400"><span>{label}</span>{hint && <span className="font-normal text-zinc-600">{hint}</span>}</span>{children}</label>;
}

function Select({ value, placeholder, options, onChange, suffix }: { value: string | number; placeholder: string; options: (string | number)[]; onChange: (value: string) => void; suffix?: string }) {
  return <div className="relative"><select value={String(value)} onChange={(e) => onChange(e.target.value)} className={selectClass}><option value="">{placeholder}</option>{options.map((option) => <option key={String(option)} value={String(option)}>{String(option)}{suffix ? ` ${suffix}` : ''}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /></div>;
}

function Section({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101012] shadow-xl shadow-black/10"><div className="border-b border-white/10 bg-white/[0.015] px-5 py-4 sm:px-6"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">{icon}</div><div><h2 className="text-sm font-bold text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-zinc-600">{description}</p></div></div></div><div className="p-5 sm:p-6">{children}</div></section>;
}

function Alert({ type, text }: { type: 'success' | 'error'; text: string }) {
  const success = type === 'success';
  return <div className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${success ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-red-500/20 bg-red-500/5 text-red-300'}`}><span className="mt-0.5">{success ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}</span><span>{text}</span></div>;
}
