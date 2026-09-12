'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { slugify, tmdbImage } from '@/lib/tmdb';
import type { FeedbackEvent } from '@/lib/cinevero-engine';

type Pick = { id:number; media_type:'movie'|'tv'; title:string; year:string; poster_path:string|null; overview:string; runtime:number|null; vote_average:number; genres:{id:number;name:string}[]; cineveroScore:number; cineveroReasons:string[]; trailerKey:string|null; providers:string[] };
type Context = { mood:string; time:number; genre:number; who:string; language:string; minRating:number; pace:string };
const moods=[['feelgood','Feel-good'],['adrenaline','Adrenaline'],['dark','Dark'],['mindbending','Mind-bending'],['emotional','Emotional'],['funny','Funny'],['scary','Scary'],['relaxing','Relaxing']];
const genres=[[28,'Action'],[35,'Comedy'],[18,'Drama'],[27,'Horror'],[878,'Sci-Fi'],[53,'Thriller'],[9648,'Mystery'],[10749,'Romance']];
const times=[[60,'Under 1 hour'],[90,'Under 90 min'],[120,'Under 2 hours'],[150,'Under 2h 30m'],[240,'Any length']];
const who=[['solo','Solo'],['couple','Couple'],['friends','Friends'],['family','Family']];
const pace=[['slow','Slow & atmospheric'],['balanced','Balanced'],['fast','Fast-paced']];
const key='cinevero-feedback-v1';
function readFeedback():FeedbackEvent[]{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}}
export default function CineveroDiscover(){
 const [step,setStep]=useState(0); const [loading,setLoading]=useState(false); const [picks,setPicks]=useState<Pick[]>([]); const [feedback,setFeedback]=useState<FeedbackEvent[]>([]);
 const [ctx,setCtx]=useState<Context>({mood:'feelgood',time:120,genre:0,who:'solo',language:'',minRating:0,pace:'balanced'});
 useEffect(()=>setFeedback(readFeedback()),[]);
 const update=(key:keyof Context,value:string|number)=>setCtx(x=>({...x,[key]:value}));
 const submit=async(nextFeedback=feedback)=>{setLoading(true);try{const res=await fetch('/api/discover',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...ctx,genre:ctx.genre||undefined,minRating:ctx.minRating||undefined,feedback:nextFeedback})});const data=await res.json();setPicks(data.picks||[]);setStep(4)}catch{setPicks([])}finally{setLoading(false)}};
 const sendFeedback=(pick:Pick,reason:FeedbackEvent['reason'])=>{const event:FeedbackEvent={action:'feedback',reason,titleId:pick.id,mediaType:pick.media_type,timestamp:Date.now()};const next=[...feedback,event];setFeedback(next);localStorage.setItem(key,JSON.stringify(next.slice(-100)));if(reason==='already-seen'||reason==='not-for-me'||reason==='too-long'||reason==='too-slow')void submit(next)};
 const reasons=useMemo(()=>({
   'too-long':'Too long','too-slow':'Too slow','already-seen':'Already seen','not-for-me':'Not for me'
 }),[]);
 return <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
  {step<4&&<><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Cinevero decision engine</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">Let Cinevero decide.</h2></div><span className="text-xs font-semibold text-zinc-400">{step+1}/4</span></div>
   {step===0&&<Choice title="What do you want to feel?" options={moods} value={ctx.mood} onChange={v=>update('mood',v)}/>} 
   {step===1&&<Choice title="How much time do you have?" options={times} value={ctx.time} onChange={v=>update('time',Number(v))}/>} 
   {step===2&&<Choice title="Who's watching?" options={who} value={ctx.who} onChange={v=>update('who',v)}/>} 
   {step===3&&<div className="mt-7 space-y-6"><Choice title="Pick a style" options={pace} value={ctx.pace} onChange={v=>update('pace',v)}/><Choice title="Optional: genre" options={[[0,'Any genre'],...genres]} value={ctx.genre} onChange={v=>update('genre',Number(v))}/><div><label className="text-sm font-bold">Minimum rating (optional)</label><div className="mt-3 flex flex-wrap gap-2">{[0,6,7,8].map(v=><button type="button" key={v} onClick={()=>update('minRating',v)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${ctx.minRating===v?'border-red-600 bg-red-600 text-white':'border-zinc-200'}`}>{v?`${v}+ / 10`:'Any rating'}</button>)}</div></div></div>}
   <div className="mt-8 flex gap-3"><button type="button" disabled={step===0} onClick={()=>setStep(s=>s-1)} className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-bold disabled:opacity-30">Back</button>{step<3?<button type="button" onClick={()=>setStep(s=>s+1)} className="rounded-xl bg-zinc-950 px-6 py-3 text-sm font-bold text-white">Continue</button>:<button type="button" onClick={()=>void submit()} disabled={loading} className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{loading?'Finding your matches…':'Find my 5 matches'}</button>}</div>
  </>}
  {step===4&&<div><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Your shortlist</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">{picks.length?'5 picks, chosen for this moment':'No strong match yet'}</h2><p className="mt-2 text-sm text-zinc-500">Cinevero scores the current context first, then explains the match.</p></div><button onClick={()=>{setStep(0);setPicks([])}} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold">Start over</button></div>
   {picks.length?<div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{picks.map((pick,i)=><article key={`${pick.media_type}-${pick.id}`} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"><Link href={`/${pick.media_type==='movie'?'movie':'series'}/${slugify(pick.title)}-${pick.id}`}><div className="aspect-[2/3] bg-zinc-100">{pick.poster_path?<img src={tmdbImage(pick.poster_path,'w342')} alt={`${pick.title} poster`} loading="lazy" className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-xs text-zinc-400">No poster</div>}</div></Link><div className="p-4"><div className="text-[11px] font-bold text-zinc-500">#{i+1} · {pick.year||'—'} · ★ {pick.vote_average.toFixed(1)}</div><Link href={`/${pick.media_type==='movie'?'movie':'series'}/${slugify(pick.title)}-${pick.id}`}><h3 className="mt-2 line-clamp-2 min-h-12 font-bold">{pick.title}</h3></Link><p className="mt-2 text-xs leading-5 text-zinc-500">{pick.cineveroReasons.join(' · ')||'Strong overall match'}</p><div className="mt-3 flex flex-wrap gap-1">{(['too-long','too-slow','already-seen','not-for-me'] as const).map(r=><button key={r} onClick={()=>sendFeedback(pick,r)} className="rounded-full border border-zinc-200 px-2 py-1 text-[10px] font-semibold hover:border-red-300">{reasons[r]}</button>)}</div>{pick.trailerKey&&<a className="mt-3 block text-xs font-bold text-red-600" href={`https://www.youtube.com/watch?v=${pick.trailerKey}`} target="_blank" rel="noreferrer">Watch trailer</a>}</div></article>)}</div>:<div className="mt-7 rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500">Try a different mood or remove the rating constraint.</div>}
   </div>}
 </div>
}
function Choice({title,options,value,onChange}:{title:string;options:(string|number)[][];value:string|number;onChange:(v:string)=>void}){return <div className="mt-7"><h3 className="text-lg font-bold">{title}</h3><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{options.map(([id,label])=><button type="button" key={String(id)} onClick={()=>onChange(String(id))} className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${String(value)===String(id)?'border-red-600 bg-red-50 text-red-700':'border-zinc-200 hover:border-red-300'}`}>{label}</button>)}</div></div>}
