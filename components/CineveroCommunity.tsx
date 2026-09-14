'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Star, ThumbsDown, ThumbsUp, Flag, Eye, Send, ShieldCheck } from 'lucide-react';

type Props = { tmdbId: number; mediaType: 'movie' | 'tv'; title: string };
type Community = { comments: any[]; rating: { average: number | null; count: number; recommendations: number; watched: number } };

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export default function CineveroCommunity({ tmdbId, mediaType, title }: Props) {
  const [data, setData] = useState<Community | null>(null);
  const [rating, setRating] = useState(0); const [recommend, setRecommend] = useState(true); const [watched, setWatched] = useState(true);
  const [name, setName] = useState(''); const [comment, setComment] = useState(''); const [spoiler, setSpoiler] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  async function load() { const response = await fetch(`/api/community?type=${mediaType}&tmdbId=${tmdbId}`, { cache: 'no-store' }); if (response.ok) setData(await response.json()); }
  useEffect(() => { load(); }, [tmdbId, mediaType]);

  async function post(body: any) {
    setBusy(true); setMessage('');
    try { const response = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, mediaType, tmdbId }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Something went wrong'); return result; }
    catch (error: any) { setMessage(error.message); return null; } finally { setBusy(false); }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim() || !comment.trim()) return;
    const result = await post({ action: 'comment', displayName: name, comment, isSpoiler: spoiler });
    if (result?.ok) { setComment(''); setSpoiler(false); setMessage('Comment published.'); await load(); }
  }

  async function submitRating(value: number) {
    setRating(value); const result = await post({ action: 'rating', rating: value, recommend, watched }); if (result?.ok) await load();
  }

  async function reaction(commentId: string, value: 'like' | 'dislike' | 'report') { const result = await post({ action: 'reaction', commentId, reaction: value }); if (result?.ok) await load(); }

  const communityAverage = data?.rating.average ?? null;
  const communityStars = communityAverage === null ? 0 : Math.max(1, Math.min(5, Math.round(communityAverage)));
  const ratingCount = data?.rating.count ?? 0;

  return <section className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6" aria-labelledby="cinevero-community-title">
    <div className="rounded-[22px] border border-[#d8edf3] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex items-center gap-2"><MessageCircle size={17} className="text-[#168aad]" /><h2 id="cinevero-community-title" className="text-xl font-black">What viewers think</h2></div><p className="mt-1 text-xs text-[#7891a3]">Share your experience with {title}. No account required.</p></div>
        <div className="flex flex-col items-end gap-1 rounded-[16px] bg-[#f4fbfd] px-3 py-2.5" aria-label={communityAverage === null ? 'No Cinevero ratings yet' : `Cinevero community rating: ${communityAverage} out of 5`}>
          <span className="text-[10px] font-black uppercase tracking-wide text-[#7891a3]">Cinevero rating</span>
          <span className="flex items-center gap-0.5" aria-hidden="true">{STAR_VALUES.map(value => <Star key={value} size={16} className={value <= communityStars ? 'text-[#ffb02e]' : 'text-[#cbdde5]'} fill={value <= communityStars ? 'currentColor' : 'none'} />)}</span>
          <span className="text-[10px] font-semibold text-[#8aa0ae]">{ratingCount ? `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}` : 'No ratings yet'}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-[18px] bg-[#f7fcff] p-4">
          <p className="text-xs font-black">Your rating</p><div className="mt-2 flex gap-1" aria-label="Rate from 1 to 5 stars">{STAR_VALUES.map(value => <button key={value} type="button" onClick={() => submitRating(value)} disabled={busy} aria-label={`Rate ${value} out of 5`} className={`rounded-md p-1 transition ${value <= rating ? 'text-[#ffb02e]' : 'text-[#c5d8e2] hover:text-[#ffb02e]'}`}><Star size={24} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</div>
          <div className="mt-3 grid gap-2"><button type="button" onClick={() => { setRecommend(v => !v); }} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold ${recommend ? 'border-[#bfe6ef] bg-white text-[#168aad]' : 'border-[#d8edf3] bg-transparent text-[#7891a3]'}`}><span>Recommend it</span><ThumbsUp size={14} /></button><button type="button" onClick={() => { setWatched(v => !v); }} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold ${watched ? 'border-[#bfe6ef] bg-white text-[#168aad]' : 'border-[#d8edf3] bg-transparent text-[#7891a3]'}`}><span>I watched it</span><Eye size={14} /></button></div>
          <p className="mt-3 text-[10px] leading-4 text-[#8aa0ae]">This community score is separate from the TMDB rating shown on the title page and in search.</p>
        </div>

        <form onSubmit={submitComment} className="rounded-[18px] border border-[#d8edf3] p-4">
          <div className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#168aad]" /><p className="text-xs font-black">Join the conversation</p><span className="text-[10px] text-[#8aa0ae]">Guest posting</span></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[170px_1fr]"><input value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder="Your name" className="rounded-xl border border-[#cfe5ed] bg-[#fbfeff] px-3 py-2.5 text-sm outline-none focus:border-[#168aad]" /><textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={1000} placeholder="What did you like or dislike?" rows={4} className="rounded-xl border border-[#cfe5ed] bg-[#fbfeff] px-3 py-2.5 text-sm outline-none focus:border-[#168aad]" /></div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-[11px] font-semibold text-[#7891a3]"><input type="checkbox" checked={spoiler} onChange={e => setSpoiler(e.target.checked)} /> Contains spoilers</label><button disabled={busy || !name.trim() || !comment.trim()} className="inline-flex items-center gap-2 rounded-full bg-[#168aad] px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"><Send size={13} /> Post comment</button></div>
          {message && <p className="mt-2 text-[11px] font-semibold text-[#e9553e]">{message}</p>}
        </form>
      </div>

      <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-black">Recent comments</h3><span className="text-[10px] font-bold text-[#8aa0ae]">{data?.comments.length ?? 0} shown</span></div>{!data?.comments.length ? <p className="rounded-xl bg-[#f7fcff] p-4 text-xs text-[#7891a3]">Be the first to share what you thought.</p> : <div className="grid gap-2.5">{data.comments.map(item => <article key={item.id} className="rounded-[16px] border border-[#d8edf3] bg-[#fbfeff] p-3.5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black">{item.display_name}</p><time className="text-[10px] text-[#8aa0ae]">{new Date(item.created_at).toLocaleDateString()}</time></div>{item.is_spoiler && <span className="rounded-full bg-[#fff1ed] px-2 py-1 text-[9px] font-black text-[#e9553e]">Spoiler</span>}</div>{item.is_spoiler && !revealed[item.id] ? <button onClick={() => setRevealed(v => ({ ...v, [item.id]: true }))} className="mt-3 rounded-lg bg-[#eef8fb] px-3 py-2 text-[11px] font-bold text-[#168aad]">Reveal spoiler</button> : <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#38566d]">{item.comment}</p>}<div className="mt-3 flex flex-wrap gap-1.5"><button onClick={() => reaction(item.id, 'like')} className="inline-flex items-center gap-1 rounded-full border border-[#d8edf3] px-2.5 py-1 text-[10px] font-bold text-[#668397]"><ThumbsUp size={11} /> {item.like_count || 0}</button><button onClick={() => reaction(item.id, 'dislike')} className="inline-flex items-center gap-1 rounded-full border border-[#d8edf3] px-2.5 py-1 text-[10px] font-bold text-[#668397]"><ThumbsDown size={11} /> {item.dislike_count || 0}</button><button onClick={() => reaction(item.id, 'report')} className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-[10px] font-bold text-[#9aabb6] hover:text-[#e9553e]"><Flag size={10} /> Report</button></div></article>)}</div>}</div>
    </div>
  </section>;
}
