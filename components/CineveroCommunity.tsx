'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Star, ThumbsDown, ThumbsUp, Flag, Eye, Send, ShieldCheck, Sparkles } from 'lucide-react';

type Props = { tmdbId: number; mediaType: 'movie' | 'tv'; title: string };
type Community = { comments: any[]; rating: { average: number | null; count: number; recommendations: number; watched: number }; mine?: { rating: number; recommend: boolean; watched: boolean } };

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export default function CineveroCommunity({ tmdbId, mediaType, title }: Props) {
  const [data, setData] = useState<Community | null>(null);
  const [rating, setRating] = useState(0); const [hoverRating, setHoverRating] = useState(0); const [recommend, setRecommend] = useState(false); const [watched, setWatched] = useState(false);
  const [name, setName] = useState(''); const [comment, setComment] = useState(''); const [spoiler, setSpoiler] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  async function load() {
    const response = await fetch(`/api/community?type=${mediaType}&tmdbId=${tmdbId}`, { cache: 'no-store' });
    if (response.ok) {
      const next = await response.json() as Community;
      setData(next);
      setRating(next.mine?.rating ?? 0);
      setRecommend(next.mine?.recommend ?? false);
      setWatched(next.mine?.watched ?? false);
    }
  }
  useEffect(() => { load(); }, [tmdbId, mediaType]);

  async function post(body: any) {
    setBusy(true); setMessage('');
    try { const response = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, mediaType, tmdbId }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Something went wrong'); return result; }
    catch (error: any) { setMessage(error.message); return null; } finally { setBusy(false); }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim() || !comment.trim()) return;
    const result = await post({ action: 'comment', displayName: name, comment, isSpoiler: spoiler });
    if (result?.ok) { setComment(''); setSpoiler(false); setMessage('Your comment is live.'); await load(); }
  }

  async function submitRating(value: number) {
    setRating(value); setHoverRating(0); const result = await post({ action: 'rating', rating: value, recommend, watched }); if (result?.ok) await load();
  }

  async function togglePreference(preference: 'recommend' | 'watched') {
    const value = preference === 'recommend' ? !recommend : !watched;
    if (preference === 'recommend') setRecommend(value); else setWatched(value);
    if (!rating) return;
    const result = await post({ action: 'preference', preference, value });
    if (result?.ok) await load(); else if (preference === 'recommend') setRecommend(!value); else setWatched(!value);
  }

  async function reaction(commentId: string, value: 'like' | 'dislike' | 'report') { const result = await post({ action: 'reaction', commentId, reaction: value }); if (result?.ok) await load(); }

  const communityAverage = data?.rating.average ?? null;
  const communityStars = communityAverage === null ? 0 : Math.max(1, Math.min(5, Math.round(communityAverage)));
  const ratingCount = data?.rating.count ?? 0;
  const recommendationCount = data?.rating.recommendations ?? 0;
  const watchedCount = data?.rating.watched ?? 0;
  const activeRating = hoverRating || rating;

  return <section className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6" aria-labelledby="cinevero-community-title">
    <div className="overflow-hidden rounded-[28px] border border-[#f0dce9] bg-gradient-to-br from-white via-[#fffaff] to-[#f4fbff] shadow-[0_12px_40px_rgba(48,77,100,0.08)]">
      <div className="border-b border-[#f2e5ed] px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0f7] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#c85b91]"><Sparkles size={12} /> Cinevero community</div>
            <div className="mt-3 flex items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#e9f8fc] text-[#168aad] shadow-sm"><MessageCircle size={18} /></span><div><h2 id="cinevero-community-title" className="text-xl font-black tracking-tight text-[#19354b] sm:text-2xl">What viewers think</h2><p className="mt-0.5 text-xs text-[#7891a3]">Your opinion helps the next viewer decide. Be the first to share a thought.</p></div></div>
          </div>
          <div className="rounded-[20px] border border-[#f0e1eb] bg-white/90 px-4 py-3 shadow-sm" aria-label={communityAverage === null ? 'No Cinevero ratings yet' : `Cinevero community rating: ${communityAverage} out of 5`}>
            <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#7891a3]">Cinevero rating</span><span className="rounded-full bg-[#fff4d9] px-2 py-0.5 text-[9px] font-black text-[#c88918]">Community</span></div>
            <span className="mt-1 flex items-center gap-0.5" aria-hidden="true">{STAR_VALUES.map(value => <Star key={value} size={17} className={value <= communityStars ? 'text-[#ffb02e]' : 'text-[#d7e2e8]'} fill={value <= communityStars ? 'currentColor' : 'none'} />)}</span>
            <span className="mt-0.5 block text-[10px] font-semibold text-[#8aa0ae]">{ratingCount ? `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}` : 'Be the first rating'}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[310px_1fr]">
        <div className="rounded-[22px] border border-[#e4eef3] bg-white/90 p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-[#19354b]">How was it?</p><p className="mt-0.5 text-[10px] text-[#8aa0ae]">Tap a star — it only takes a second.</p></div><span className="rounded-full bg-[#eef9fc] px-2.5 py-1 text-[9px] font-black text-[#168aad]">No account</span></div>
          <div className="mt-3 flex gap-0.5 rounded-2xl bg-[#fffaf0] px-2 py-2" role="radiogroup" aria-label="Rate from 1 to 5 stars" onMouseLeave={() => setHoverRating(0)}>
            {STAR_VALUES.map(value => <button key={value} type="button" onClick={() => submitRating(value)} onMouseEnter={() => setHoverRating(value)} onFocus={() => setHoverRating(value)} onBlur={() => setHoverRating(0)} disabled={busy} aria-label={`Rate ${value} out of 5`} aria-checked={rating === value} role="radio" className={`flex-1 rounded-xl p-1.5 transition-all duration-100 ${value <= activeRating ? 'scale-105 text-[#ffb02e]' : 'text-[#d5e0e6] hover:text-[#ffb02e]'}`}><Star size={28} className="mx-auto" fill={value <= activeRating ? 'currentColor' : 'none'} strokeWidth={1.9} /></button>)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => togglePreference('recommend')} disabled={busy || !rating} className={`group inline-flex min-h-9 items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left text-[11px] font-bold transition-colors ${recommend ? 'border-[#8ed9e6] bg-[#e9f9fc] text-[#168aad]' : 'border-[#e4eef3] bg-white text-[#607b8e] hover:border-[#b9e4ec] hover:bg-[#f8fdff]'}`} aria-pressed={recommend} title={!rating ? 'Rate this title first' : 'Recommend this title'}><span className="inline-flex min-w-0 items-center gap-1.5"><ThumbsUp size={15} className={recommend ? 'fill-current' : ''} /><span>Recommend it</span></span><span className="tabular-nums text-[10px] font-black">{recommendationCount}</span></button>
            <button type="button" onClick={() => togglePreference('watched')} disabled={busy || !rating} className={`group inline-flex min-h-9 items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left text-[11px] font-bold transition-colors ${watched ? 'border-[#8ed9e6] bg-[#e9f9fc] text-[#168aad]' : 'border-[#e4eef3] bg-white text-[#607b8e] hover:border-[#b9e4ec] hover:bg-[#f8fdff]'}`} aria-pressed={watched} title={!rating ? 'Rate this title first' : 'Mark as watched'}><span className="inline-flex min-w-0 items-center gap-1.5"><Eye size={15} className={watched ? 'fill-current' : ''} /><span>I watched it</span></span><span className="tabular-nums text-[10px] font-black">{watchedCount}</span></button>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-[#8aa0ae]">Community ratings are separate from the TMDB rating shown on the title page and in search.</p>
        </div>

        <form onSubmit={submitComment} className="relative overflow-hidden rounded-[22px] border border-[#f0dce9] bg-gradient-to-br from-[#fff7fb] via-white to-[#f5fcff] p-4 shadow-sm sm:p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ffe4f0] opacity-60 blur-2xl" />
          <div className="relative flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#c85b91] shadow-sm"><MessageCircle size={18} /></span><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black text-[#19354b]">Tell everyone what you thought</p><span className="rounded-full bg-[#fff0f7] px-2 py-0.5 text-[9px] font-black text-[#c85b91]">Guest posting</span></div><p className="mt-0.5 text-[11px] leading-5 text-[#7891a3]">Loved it? Didn’t like it? A quick honest comment can help someone choose tonight’s watch.</p></div></div>
          <div className="relative mt-4 grid gap-2 sm:grid-cols-[90px_1fr]"><input value={name} onChange={e => setName(e.target.value)} maxLength={40} required aria-required="true" placeholder="Name" className="h-10 rounded-xl border border-[#e2dce7] bg-white px-2.5 text-xs outline-none transition focus:border-[#c85b91] focus:ring-4 focus:ring-[#ffeaf3]" /><textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={1000} required aria-required="true" placeholder="What did you love, dislike, or recommend?" rows={4} className="rounded-2xl border border-[#e2dce7] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#c85b91] focus:ring-4 focus:ring-[#ffeaf3]" /></div>
          <div className="relative mt-3 flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-[11px] font-semibold text-[#7891a3]"><input type="checkbox" checked={spoiler} onChange={e => setSpoiler(e.target.checked)} className="accent-[#c85b91]" /> Contains spoilers</label><button type="submit" disabled={busy || !name.trim() || !comment.trim()} className="inline-flex items-center gap-2 rounded-full bg-[#c85b91] px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"><Send size={13} /> Share your thought</button></div>
          {message && <p className="relative mt-2 text-[11px] font-semibold text-[#e9553e]">{message}</p>}
        </form>
      </div>

      <div className="border-t border-[#f2e5ed] px-4 pb-5 sm:px-6 sm:pb-6"><div className="mb-3 flex items-center justify-between pt-5"><div><h3 className="text-sm font-black text-[#19354b]">Recent comments</h3><p className="mt-0.5 text-[10px] text-[#8aa0ae]">Real reactions from viewers</p></div><span className="rounded-full bg-[#f5f9fb] px-2.5 py-1 text-[10px] font-bold text-[#8aa0ae]">{data?.comments.length ?? 0} shown</span></div>{!data?.comments.length ? <div className="rounded-[18px] border border-dashed border-[#e5dbe3] bg-white px-4 py-6 text-center"><MessageCircle size={22} className="mx-auto text-[#d49bb7]" /><p className="mt-2 text-sm font-black text-[#405d70]">Your comment could start the conversation.</p><p className="mt-1 text-[11px] text-[#8aa0ae]">Share one thing you loved, one thing you didn’t, or simply tell us if you’d recommend it.</p></div> : <div className="grid gap-2.5">{data.comments.map(item => <article key={item.id} className="rounded-[18px] border border-[#e4eef3] bg-white p-3.5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-[#19354b]">{item.display_name}</p><time className="text-[10px] text-[#8aa0ae]">{new Date(item.created_at).toLocaleDateString()}</time></div>{item.is_spoiler && <span className="rounded-full bg-[#fff1ed] px-2 py-1 text-[9px] font-black text-[#e9553e]">Spoiler</span>}</div>{item.is_spoiler && !revealed[item.id] ? <button onClick={() => setRevealed(v => ({ ...v, [item.id]: true }))} className="mt-3 rounded-lg bg-[#eef8fb] px-3 py-2 text-[11px] font-bold text-[#168aad]">Reveal spoiler</button> : <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#38566d]">{item.comment}</p>}<div className="mt-3 flex flex-wrap gap-1.5"><button onClick={() => reaction(item.id, 'like')} className="inline-flex items-center gap-1 rounded-full border border-[#d8edf3] px-2.5 py-1 text-[10px] font-bold text-[#668397] transition hover:border-[#b9e4ec] hover:text-[#168aad]"><ThumbsUp size={11} /> {item.like_count || 0}</button><button onClick={() => reaction(item.id, 'dislike')} className="inline-flex items-center gap-1 rounded-full border border-[#d8edf3] px-2.5 py-1 text-[10px] font-bold text-[#668397] transition hover:border-[#b9e4ec] hover:text-[#e9553e]"><ThumbsDown size={11} /> {item.dislike_count || 0}</button><button onClick={() => reaction(item.id, 'report')} className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-[10px] font-bold text-[#9aabb6] hover:text-[#e9553e]"><Flag size={10} /> Report</button></div></article>)}</div>}</div>
    </div>
  </section>;
}
