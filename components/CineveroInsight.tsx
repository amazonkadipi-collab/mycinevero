type InsightProps = {
  title: string;
  genres: string[];
  runtime?: number | null;
  overview?: string;
  type?: 'movie' | 'series';
};

function buildMood(genres: string[]) {
  if (genres.includes('Comedy') || genres.includes('Family')) return 'light, accessible, and easygoing';
  if (genres.includes('Horror')) return 'dark, suspenseful, and atmospheric';
  if (genres.includes('Thriller') || genres.includes('Crime')) return 'tense, focused, and suspense-driven';
  if (genres.includes('Drama') || genres.includes('Mystery')) return 'thoughtful, character-led, and story-focused';
  if (genres.includes('Action') || genres.includes('Adventure')) return 'fast-moving, energetic, and spectacle-driven';
  if (genres.includes('Romance')) return 'relationship-focused and emotionally driven';
  return 'engaging and cinematic';
}

function buildRuntimeAdvice(runtime?: number | null) {
  if (typeof runtime !== 'number') return 'Runtime information can vary by release or episode, so check the title details before planning your viewing time.';
  if (runtime < 100) return 'Its shorter runtime makes it a practical option when you want a complete story without committing to a long movie night.';
  if (runtime >= 150) return 'This is a longer watch, so it works best when you have enough uninterrupted time to settle into the story.';
  return 'The runtime fits a typical focused movie night, making it easier to plan around a single viewing session.';
}

export default function CineveroInsight({ title, genres, runtime, overview, type = 'movie' }: InsightProps) {
  const genreText = genres.slice(0, 3).join(', ') || 'its genre mix';
  const mood = buildMood(genres);
  const runtimeAdvice = buildRuntimeAdvice(runtime);
  const isSeries = type === 'series';
  const overviewText = overview?.trim();

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6" aria-labelledby="cinevero-guide-title">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">Cinevero viewing guide</p>
        <h2 id="cinevero-guide-title" className="mt-2 text-2xl font-bold">Is {title} worth watching?</h2>
        <div className="mt-5 space-y-4 max-w-4xl text-zinc-300 leading-7">
          <p>
            {title} is a {isSeries ? 'series' : 'movie'} built around {genreText.toLowerCase()}. Its overall viewing feel is {mood}, which makes it a useful pick when you already know the kind of experience you want rather than choosing a title at random.
          </p>
          {overviewText ? (
            <p>
              The story overview points toward the title's central premise, while the genre combination gives additional context about the tone and type of storytelling to expect. If that premise matches what you are looking for tonight, the title is worth exploring further through its trailer, cast, and related recommendations.
            </p>
          ) : null}
          <p>{runtimeAdvice}</p>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Best for</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">Viewers looking for {mood} entertainment.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Viewing plan</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{runtimeAdvice}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cinevero take</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">Start with the trailer and story details, then use the related titles to compare alternatives before choosing.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
