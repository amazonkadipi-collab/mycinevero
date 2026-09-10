'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  LogIn,
  LogOut,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings2,
  SlidersHorizontal,
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
  items_per_page: number | '';
  cache_duration: number | '';
};

const EMPTY: Settings = {
  query: '',
  order: '',
  per_page: '',
  thumbsize: '',
  gay: '',
  lq: '',
  format: '',
  method: '',
  video_id: '',
  api_base_url: '',
  items_per_page: '',
  cache_duration: '',
};

const ORDERS = ['latest', 'longest', 'shortest', 'top-rated', 'most-popular', 'top-weekly', 'top-monthly'];
const PAGES = [12, 24, 48, 96];
const THUMBS = ['small', 'medium', 'big'];
const FILTERS = [0, 1, 2];
const FORMATS = ['json', 'xml'];
const METHODS = ['search', 'id', 'removed'];
const CACHE = [0, 60, 300, 3600];

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
    fetch('/api/admin/login', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (authenticated) loadSettings();
  }, [authenticated]);

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/settings', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load settings.');
      setSettings({ ...EMPTY, ...(data.settings || {}) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }

  function update(key: keyof Settings, value: string | number) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage('');
    setError('');
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid credentials');
      setUsername('');
      setPassword('');
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthenticated(false);
    setSettings(EMPTY);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save settings.');
      setSettings({ ...EMPTY, ...(data.settings || {}) });
      setMessage('Settings saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setBusy(false);
    }
  }

  if (authenticated === null) {
    return <div className="min-h-screen bg-[#0a0a0a]" />;
  }

  const header = (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/15 ring-1 ring-red-500/20">
            <Settings2 className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <div className="text-sm font-black tracking-[0.18em] text-white">ADMIN</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">API Settings</div>
          </div>
        </div>
        {authenticated && (
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white sm:flex">
              <ArrowLeft className="h-3.5 w-3.5" /> Portal
            </Link>
            <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
        {header}
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl shadow-black/40">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/10 ring-1 ring-red-500/20">
                <KeyRound className="h-6 w-6 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-zinc-500">Sign in to manage API Settings.</p>
            </div>
            <div className="space-y-4">
              <Field label="Username">
                <input required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" autoComplete="username" className={inputClass} />
              </Field>
              <Field label="Password">
                <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" autoComplete="current-password" className={inputClass} />
              </Field>
            </div>
            <button disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
              <LogIn className="h-4 w-4" /> {busy ? 'Signing in…' : 'Sign in'}
            </button>
            {error && <Alert type="error" text={error} />}
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      {header}
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-8">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-red-400">Administration</div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">API Settings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Configure search settings, API methods and API connection settings.</p>
        </div>

        {loading && <div className="mb-5 flex items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-zinc-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading saved settings…</div>}
        {message && <Alert type="success" text={message} />}
        {error && <Alert type="error" text={error} />}

        <form onSubmit={save} className="space-y-5">
          <Section icon={<Search />} number="01" title="Search Settings" description="Search parameters. All fields are optional and start empty.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Search Query" full><input value={settings.query} onChange={(event) => update('query', event.target.value)} placeholder="Enter search query..." className={inputClass} /></Field>
              <Field label="Order"><Select value={settings.order} placeholder="Select order..." options={ORDERS} onChange={(value) => update('order', value)} /></Field>
              <Field label="Per Page"><Select value={settings.per_page} placeholder="Select per page..." options={PAGES} onChange={(value) => update('per_page', value === '' ? '' : Number(value))} /></Field>
              <Field label="Thumb Size"><Select value={settings.thumbsize} placeholder="Select thumb size..." options={THUMBS} onChange={(value) => update('thumbsize', value)} /></Field>
              <Field label="Filter Option A"><Select value={settings.gay} placeholder="Select option..." options={FILTERS} onChange={(value) => update('gay', value === '' ? '' : Number(value))} /></Field>
              <Field label="Filter Option B"><Select value={settings.lq} placeholder="Select option..." options={FILTERS} onChange={(value) => update('lq', value === '' ? '' : Number(value))} /></Field>
              <Field label="Response Format"><Select value={settings.format} placeholder="Select format..." options={FORMATS} onChange={(value) => update('format', value)} /></Field>
            </div>
          </Section>

          <Section icon={<SlidersHorizontal />} number="02" title="API Methods" description="Choose the API method and provide an ID when needed.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="API Method"><Select value={settings.method} placeholder="Select method..." options={METHODS} onChange={(value) => update('method', value)} /></Field>
              <Field label="Video ID"><input value={settings.video_id} onChange={(event) => update('video_id', event.target.value)} placeholder="Enter video ID..." className={inputClass} /></Field>
            </div>
          </Section>

          <Section icon={<Server />} number="03" title="API Configuration" description="Configure the API base URL and delivery behavior.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="API Base URL" full><input type="url" value={settings.api_base_url} onChange={(event) => update('api_base_url', event.target.value)} placeholder="https://example.com/api/v2/" className={inputClass} /></Field>
              <Field label="Items Per Page"><Select value={settings.items_per_page} placeholder="Select items per page..." options={PAGES} onChange={(value) => update('items_per_page', value === '' ? '' : Number(value))} /></Field>
              <Field label="Cache Duration"><Select value={settings.cache_duration} placeholder="Select cache duration (seconds)..." options={CACHE} suffix=" seconds" onChange={(value) => update('cache_duration', value === '' ? '' : Number(value))} /></Field>
            </div>
          </Section>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-600">Fields are intentionally blank until you configure and save them.</p>
            <div className="flex gap-2">
              <button type="button" onClick={loadSettings} disabled={busy || loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Reload
              </button>
              <button type="submit" disabled={busy || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
                <Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) {
  return <div className={`flex flex-col gap-2 ${full ? 'sm:col-span-2 lg:col-span-4' : ''}`}><label className="text-xs font-semibold text-zinc-300">{label}</label>{children}</div>;
}

function Select({ value, placeholder, options, onChange, suffix = '' }: { value: string | number; placeholder: string; options: Array<string | number>; onChange: (value: string) => void; suffix?: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => <option key={String(option)} value={String(option)}>{String(option)}{suffix}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">⌄</span>
    </div>
  );
}

function Section({ icon, number, title, description, children }: { icon: ReactNode; number: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-xl shadow-black/10">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10 text-red-400 ring-1 ring-red-500/15">{icon}</div>
          <div>
            <div className="mb-1 text-[10px] font-black tracking-[0.16em] text-red-400">{number}</div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Alert({ type, text }: { type: 'success' | 'error'; text: string }) {
  const success = type === 'success';
  return (
    <div className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${success ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-red-500/20 bg-red-500/5 text-red-300'}`}>
      {success ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{text}</span>
    </div>
  );
}
