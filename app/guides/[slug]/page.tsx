import type { Metadata } from 'next';
import Link from 'next/link';

const guides: Record<string, { title: string; description: string; sections: [string, string][] }> = {
  'how-to-choose-a-movie-by-mood': { title: 'How to Choose a Movie by Mood', description: 'A practical framework for choosing a movie when you know the feeling you want more than the title.', sections: [
    ['Start with the feeling, not the genre', 'Genre is useful, but mood is often a better first filter. Decide whether you want something relaxing, funny, tense, emotional, mysterious or visually immersive. Two dramas can create completely different evenings, so the feeling you want matters before the label.' ],
    ['Match the intensity to your evening', 'A demanding thriller may be a poor choice after a long day, while a slow character drama can feel perfect when you have time to settle in. Think about your attention level as well as your preferred mood.' ],
    ['Use runtime as a practical filter', 'Runtime changes the shape of a movie night. A compact film leaves room for another activity, while a longer film asks you to commit. Runtime is not a quality score; it is simply a planning tool.' ],
    ['Look for a specific reason to choose it', 'Once you have a mood and time limit, ask what makes one title stand out. It might be the story premise, cast, atmosphere, pacing or the kind of experience it promises. A specific reason is more useful than endlessly comparing ratings.' ],
  ] },
  'what-to-watch-when-you-have-90-minutes': { title: 'What to Watch When You Have 90 Minutes', description: 'How to make a good movie choice when your available viewing time is limited.', sections: [
    ['Treat 90 minutes as a planning window', 'A 90-minute window does not mean you need a film with exactly 90 minutes of runtime. Leave room for choosing the title, starting the film and any interruptions. A slightly shorter movie can be the more comfortable choice.' ],
    ['Prioritize pacing', 'When time is limited, pacing matters. Look for films described by their genre and tone in a way that matches your attention level. A compact story can feel more satisfying than a longer film that requires a second sitting.' ],
    ['Do not confuse shorter with easier', 'A short movie can still be intense, emotional or complicated. Runtime tells you how long it lasts, not how mentally demanding it will feel. Combine time with mood and story type before deciding.' ],
    ['Make the decision quickly', 'Set two or three filters, shortlist a few titles and choose. The purpose of a discovery service is to reduce decision fatigue, not replace one endless catalogue with another.' ],
  ] },
  'movie-or-tv-series': { title: 'Movie or TV Series: Which Is Better Tonight?', description: 'A simple decision framework for choosing between a single film and a longer series commitment.', sections: [
    ['Choose a movie when you want closure', 'A movie is ideal when tonight is a self-contained viewing session. You can start, experience the story and finish without creating a new long-term commitment.' ],
    ['Choose a series when you want continuity', 'A series works better when you enjoy returning to the same characters and world. It is a good choice when you want something that can become part of several evenings rather than one complete session.' ],
    ['Consider your attention span', 'A series may look easier because an episode is short, but the larger commitment can be significant. A movie may require more uninterrupted attention tonight while creating less commitment overall.' ],
    ['Let the evening decide', 'There is no universal winner. If you have limited time or want a finished story, choose a movie. If you want an ongoing narrative and expect to watch again, a series may fit better.' ],
  ] },
  'how-cinevero-recommendations-work': { title: 'How Cinevero Recommendations Work', description: 'An explanation of the factors Cinevero uses to make movie and TV discovery more focused.', sections: [
    ['Mood and viewing context', 'Cinevero is designed around the question behind the search: what kind of viewing experience do you want right now? Mood and context help turn a broad catalogue into a smaller set of relevant choices.' ],
    ['Genre and story identity', 'Genre provides a useful starting point, but it is not treated as the entire recommendation. A title can belong to several genres and still create a very different experience from another title with the same label.' ],
    ['Time and pace', 'Runtime is useful for planning, while perceived pace helps describe how a title may fit the evening. These factors help users avoid choosing a title that conflicts with the time or attention they actually have.' ],
    ['Third-party catalogue data plus original guidance', 'Cinevero uses third-party catalogue metadata for title information and combines it with its own interface, organization and viewing guidance. The goal is to add decision-making context instead of simply reproducing a catalogue.' ],
  ] },
  'how-to-find-a-good-movie-without-scrolling-forever': { title: 'How to Find a Good Movie Without Scrolling Forever', description: 'A focused discovery method for replacing endless browsing with a small, useful shortlist.', sections: [
    ['Start with one constraint', 'Pick one meaningful constraint first: mood, available time, genre, or whether you want a movie or series. Starting with everything at once usually creates too many options.' ],
    ['Add one second filter', 'After the first filter, add only one more. For example, combine a relaxed mood with a short runtime, or a mystery genre with a longer evening. Two useful filters are usually more helpful than ten weak ones.' ],
    ['Compare reasons, not just ratings', 'Ratings can help, but they do not tell you whether a title suits your evening. Compare the reason each candidate fits: atmosphere, story type, runtime, intensity or the kind of attention it needs.' ],
    ['Stop when the choice is good enough', 'Discovery should lead to watching. Once one title clearly fits the evening, stop searching and press play. A perfect choice is less valuable than a good choice you actually watch.' ],
  ] },
};

export function generateStaticParams() { return Object.keys(guides).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides[slug];
  return guide ? { title: `${guide.title} | Cinevero`, description: guide.description, alternates: { canonical: `/guides/${slug}` } } : { title: 'Guide | Cinevero' };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides[slug];
  if (!guide) return <main className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-3xl font-black">Guide not found</h1><Link className="mt-5 inline-block font-bold" href="/guides">Back to guides</Link></main>;
  return <main className="min-h-screen bg-[#fbfaf7] text-zinc-900"><article className="mx-auto max-w-3xl px-5 py-14 sm:px-8"><Link href="/guides" className="text-sm font-bold text-[#6547d8]">← All guides</Link><p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-[#7751ff]">CINEVERO EDITORIAL GUIDE</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{guide.title}</h1><p className="mt-5 text-lg leading-8 text-zinc-600">{guide.description}</p><div className="mt-10 space-y-10">{guide.sections.map(([heading, body]) => <section key={heading}><h2 className="text-2xl font-black">{heading}</h2><p className="mt-3 text-base leading-8 text-zinc-700">{body}</p></section>)}</div><div className="mt-12 rounded-3xl border border-zinc-200 bg-white p-6"><h2 className="text-xl font-black">Ready to choose?</h2><p className="mt-2 leading-7 text-zinc-600">Use Cinevero discovery to narrow movies and series by mood, genre, time and viewing context.</p><Link href="/discover" className="mt-4 inline-block rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white">Explore Cinevero</Link></div></article></main>;
}
