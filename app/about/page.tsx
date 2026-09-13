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
          A title page is designed to do more than display a poster and a score. Cinevero adds a concise viewing guide that explains the kind of experience a title is suited to, who may enjoy it, and how it fits a particular movie-night decision. We also provide trailers, basic title details, genres, cast information, and related recommendations to help you make an informed choice.
        </p>
        <h2>How our recommendations work</h2>
        <p>
          Cinevero combines structured movie and TV metadata with our own presentation and viewing-oriented editorial layer. Recommendations are intended as discovery suggestions, not guarantees that a title will match every viewer's taste. Availability, release information, ratings, and other title data can change over time.
        </p>
        <h2>Our approach to content</h2>
        <p>
          We aim to provide useful context instead of simply reproducing catalogue information. Our goal is to make each discovery page clearer, easier to navigate, and more helpful for deciding what to watch next.
        </p>
        <h2>Third-party data and media</h2>
        <p>
          Cinevero uses third-party services for selected catalogue metadata, artwork, and trailers. Third-party material remains subject to its respective provider's terms and rights. Cinevero does not claim ownership of third-party movie, TV, poster, cast, or trailer content.
        </p>
        <h2>Questions, corrections, or copyright concerns</h2>
        <p>
          If you need to report an issue, request a correction, or raise a copyright concern, please use our Contact and DMCA pages. We review valid reports and update or remove information when appropriate.
        </p>
      </article>
    </main>
  );
}
