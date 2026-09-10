'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, LogIn, LogOut, Save, Settings2 } from 'lucide-react';

type Settings = {
  query: string; order: string; per_page: number | ''; thumbsize: string; gay: number | ''; lq: number | ''; format: string;
  method: string; video_id: string; api_base_url: string; api_search_path: string; api_details_path: string;
  api_timeout_ms: number | ''; api_format: string; items_per_page: number | ''; cache_duration: number | '';
};

const EMPTY: Settings = {
  query:'', order:'', per_page:'', thumbsize:'', gay:'', lq:'', format:'', method:'', video_id:'', api_base_url:'',
  api_search_path:'', api_details_path:'', api_timeout_ms:'', api_format:'', items_per_page:'', cache_duration:'',
};
const ORDERS = ['latest','longest','shortest','top-rated','most-popular','top-weekly','top-monthly'];
const PAGES = [12,24,48,96];
const THUMBS = ['small','medium','big'];
const FILTERS = [0,1,2];
const FORMATS = ['json','xml'];
const METHODS = ['search','id','removed'];
const CACHE = [0,60,300,3600];

export default function AdminPage() {
  const [authenticated,setAuthenticated] = useState<boolean|null>(null);
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [settings,setSettings] = useState<Settings>(EMPTY);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);

  useEffect(()=>{ fetch('/api/admin/login',{cache:'no-store'}).then(r=>r.json()).then(d=>setAuthenticated(Boolean(d.authenticated))).catch(()=>setAuthenticated(false)); },[]);
  useEffect(()=>{ if(!authenticated) return; fetch('/api/settings',{cache:'no-store'}).then(async r=>{const d=await r.json(); if(!r.ok) throw new Error(d.error); return d.settings||EMPTY;}).then(d=>setSettings({...EMPTY,...d})).catch(e=>setError(e instanceof Error?e.message:'Failed to load settings.')); },[authenticated]);

  const set = (key:keyof Settings,value:string|number) => setSettings(s=>({...s,[key]:value}));

  async function login(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Invalid credentials');setUsername('');setPassword('');setAuthenticated(true);}catch(e){setError(e instanceof Error?e.message:'Invalid credentials');}finally{setBusy(false);}}
  async function logout(){await fetch('/api/admin/login',{method:'DELETE'});setAuthenticated(false);}
  async function save(e:FormEvent){e.preventDefault();setBusy(true);setMessage('');setError('');try{const r=await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(settings)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Failed to save settings');setSettings({...EMPTY,...d.settings});setMessage('Settings saved successfully.');}catch(e){setError(e instanceof Error?e.message:'Failed to save settings');}finally{setBusy(false);}}

  if(authenticated===null)return <div className="min-h-screen bg-zinc-950"/>;
  const header=<header className="sticky top-0 z-40 border-b border-red-950 bg-red-800 text-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"><div className="flex items-center gap-3"><Settings2 className="h-5 w-5 text-red-300"/><div><div className="font-black">ELOVEX</div><div className="text-[10px] uppercase tracking-wider text-red-200/70">Admin Dashboard</div></div></div>{authenticated&&<div className="flex items-center gap-4 text-sm"><Link href="/" className="flex items-center gap-1 text-red-100 hover:text-white"><ArrowLeft className="h-4 w-4"/>Portal</Link><button onClick={logout} className="flex items-center gap-1 text-red-100 hover:text-white"><LogOut className="h-4 w-4"/>Logout</button></div>}</div></header>;

  if(!authenticated)return <div className="min-h-screen bg-zinc-950 text-zinc-200">{header}<main className="mx-auto max-w-md px-4 py-16"><form onSubmit={login} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"><h1 className="mb-1 text-xl font-bold text-white">Admin Login</h1><p className="mb-6 text-sm text-zinc-500">Sign in to manage dashboard settings.</p><input required value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" autoComplete="username" className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-red-500"/><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Admin password" autoComplete="current-password" className="mb-4 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-red-500"/><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 font-bold text-white hover:bg-red-600 disabled:opacity-50"><LogIn className="h-4 w-4"/>{busy?'Signing in...':'Login'}</button>{error&&<p className="mt-4 rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}</form></main></div>;

  const input='w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-red-500';
  const select=input+' cursor-pointer';
  const label=(title:string,child:ReactNode,full=false)=><label className={full?'sm:col-span-2':''}><span className="mb-2 block text-sm text-zinc-300">{title}</span>{child}</label>;
  const makeSelect=(value:string|number,placeholder:string,options:(string|number)[],onChange:(v:string)=>void)=><select value={String(value)} onChange={e=>onChange(e.target.value)} className={select}><option value="">{placeholder}</option>{options.map(v=><option key={String(v)} value={String(v)}>{String(v)}</option>)}</select>;

  return <div className="min-h-screen bg-zinc-950 text-zinc-200">{header}<main className="mx-auto max-w-5xl px-4 py-8"><form onSubmit={save} className="space-y-6"><div><h1 className="text-2xl font-bold text-white">API Settings</h1><p className="mt-1 text-sm text-zinc-500">Configure all API parameters. Fields are blank until configured.</p></div>
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="mb-5 text-lg font-semibold text-white">Search Settings</h2><div className="grid gap-5 sm:grid-cols-2">
      {label('Search Query',<input value={settings.query} onChange={e=>set('query',e.target.value)} placeholder="Enter search query..." className={input}/> ,true)}
      {label('Order',makeSelect(settings.order,'Select order...',ORDERS,v=>set('order',v)))}
      {label('Per Page',makeSelect(settings.per_page,'Select per page...',PAGES,v=>set('per_page',v===''?'':Number(v))))}
      {label('Thumb Size',makeSelect(settings.thumbsize,'Select thumb size...',THUMBS,v=>set('thumbsize',v)))}
      {label('Filter Option A',makeSelect(settings.gay,'Select option...',FILTERS,v=>set('gay',v===''?'':Number(v))))}
      {label('Filter Option B',makeSelect(settings.lq,'Select option...',FILTERS,v=>set('lq',v===''?'':Number(v))))}
      {label('Response Format',makeSelect(settings.format,'Select format...',FORMATS,v=>set('format',v)))}
    </div></section>

    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="mb-5 text-lg font-semibold text-white">API Methods</h2><div className="grid gap-5 sm:grid-cols-2">
      {label('API Method',makeSelect(settings.method,'Select method...',METHODS,v=>set('method',v)))}
      {label('Video ID',<input value={settings.video_id} onChange={e=>set('video_id',e.target.value)} placeholder="Enter video ID..." className={input}/>)}
    </div></section>

    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="mb-5 text-lg font-semibold text-white">API Configuration</h2><div className="grid gap-5 sm:grid-cols-2">
      {label('API Base URL',<input type="url" value={settings.api_base_url} onChange={e=>set('api_base_url',e.target.value)} placeholder="https://example.com/api/v2/" className={input}/>,true)}
      {label('Items Per Page',makeSelect(settings.items_per_page,'Select items per page...',PAGES,v=>set('items_per_page',v===''?'':Number(v))))}
      {label('Cache Duration',makeSelect(settings.cache_duration,'Select cache duration (seconds)...',CACHE,v=>set('cache_duration',v===''?'':Number(v))))}
    </div></section>

    <div className="flex flex-wrap items-center gap-3"><button disabled={busy} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 font-bold text-white hover:bg-red-600 disabled:opacity-50"><Save className="h-4 w-4"/>{busy?'Saving...':'Save Settings'}</button>{message&&<span className="inline-flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4"/>{message}</span>}</div>{error&&<p className="rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}</form></main></div>;
}
