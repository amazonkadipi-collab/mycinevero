import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Movie & TV Guides | Cinevero',
  description: 'Original Cinevero guides for choosing movies and TV series by mood, time, genre and viewing context.',
  alternates: { canonical: '/guides' },
};

const guides = [
  ['how-to-choose-a-movie-by-mood', 'How to Choose a Movie by Mood', 'A practical way to narrow a huge catalogue when you know how you want the evening to feel.'],
  ['what-to-watch-when-you-have-90-minutes', 'What to Watch When You Have 90 Minutes', 'How runtime changes the best movie-night choices when your time is limited.'],
  ['movie-or-tv-series', 'Movie or TV Series: Which Is Better Tonight?', 'A simple decision framework based on time, attention and the kind of story you want.'],
  ['how-cinevero-recommendations-work', 'How Cinevero Recommendations Work', 'How Cinevero combines mood, genre, pace, runtime and viewing context to narrow choices.'],
  ['how-to-find-a-good-movie-without-scrolling-forever', 'How to Find a Good Movie Without Scrolling Forever', 'A focused approach to discovery that avoids endless catalogue browsing.'],
];

export default function GuidesPage() {
  return <main className="min-h-screen bg-[#fbfaf7] text-zinc-900"><div className="mx-auto max-w-5xl px-5 py-14 sm:px-8"><p className="text-xs font-black uppercase tracking-[.2em] text-[#7751ff]">CINEVERO EDITORIAL</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Movie & TV Guides</h1><p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">Original, practical guides written to help you decide what to watch. These guides add context and decision-making advice rather than repeating catalogue metadata.</p><div className="mt-10 grid gap-5 sm:grid-cols-2">{guides.map(([slug, title, description]) => <article key={slug} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black"><Link className="hover:underline" href={`/guides/${slug}`}>{title}</Link></h2><p className="mt-3 leading-7 text-zinc-600">{description}</p><Link className="mt-5 inline-block text-sm font-bold text-[#6547d8]" href={`/guides/${slug}`}>Read guide →</Link></article>)}</div></div></main>;
}
