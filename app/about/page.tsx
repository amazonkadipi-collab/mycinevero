import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Cinevero',
  description: 'Learn how Cinevero helps viewers discover movies and TV series through practical, human-readable recommendations and viewing guidance.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 text-zinc-800">
      <article className="prose prose-zinc max-w-none">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">About Cinevero</p>
        <h1>Helping you decide what to watch</h1>
        <p>
          Cinevero is a movie and TV discovery site built around a simple problem: finding something worth watching can take longer than watching it. We organize titles into practical discovery experiences so you can narrow your choices by genre, mood, popularity, release timing, runtime, and viewing context.
        </p>
        <h2>What makes Cinevero useful</h2>
        <p>
          A title page is designed to do more than display a poster and a score. Cinevero adds a viewing-oriented editorial layer that explains the kind of experience a title is suited to, who may enjoy it, and how it fits a particular movie-night decision. We also provide trailers, title details, genres, cast information, and related recommendations to help you make an informed choice.
        </p>
        <h2>How our recommendations work</h2>
        <p>
          Cinevero combines structured catalogue metadata with our own presentation and viewing guidance. Discovery lists can use signals such as popularity, genre, release timing, runtime, and related titles. The editorial guidance is written to help with a viewing decision rather than to reproduce a provider's catalogue description. Recommendations are suggestions, not guarantees that a title will match every viewer's taste.
        </p>
        <h2>How we approach editorial content</h2>
        <p>
          We aim to add useful context instead of publishing pages that only repeat posters, ratings, or database fields. Our guides cover practical questions such as choosing a film by mood, matching a movie to the time available, and deciding between a film and a series. We review the site structure and editorial pages for clarity, usefulness, and consistency as the catalogue changes.
        </p>
        <h2>Third-party data and media</h2>
        <p>
          Cinevero uses third-party services for selected catalogue metadata, artwork, and trailers. Third-party material remains subject to its respective provider's terms and rights. Cinevero does not claim ownership of third-party movie, TV, poster, cast, or trailer content and does not host movie or TV video files.
        </p>
        <h2>Questions, corrections, or copyright concerns</h2>
        <p>
          If you need to report an issue, request a correction, or raise a copyright concern, please use our Contact and DMCA pages. Include the relevant page URL and enough detail for the issue to be reviewed. Valid reports are handled according to the applicable site policies.
        </p>
      </article>
    </main>
  );
}
