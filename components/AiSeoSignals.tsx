import Link from 'next/link';

const faqs = [
  {
    question: 'What is Cinevero?',
    answer: 'Cinevero is a movie and TV discovery platform designed to help you decide what to watch based on mood, available time, viewing context and preferences.',
  },
  {
    question: 'How does Cinevero help me choose what to watch?',
    answer: 'Cinevero combines movie and TV metadata with context-aware recommendations, then explains why each suggested title matches your current preferences.',
  },
  {
    question: 'Can I discover movies by mood and time?',
    answer: 'Yes. Cinevero Discover lets you use mood, time available, who you are watching with, pace and genre preferences to narrow down recommendations.',
  },
];

export default function AiSeoSignals() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <section className="mx-auto max-w-[1180px] px-4 pb-14 sm:px-6" aria-labelledby="cinevero-about">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="border-t border-white/10 pt-10">
        <h2 id="cinevero-about" className="text-xl font-bold">Find something worth watching</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Cinevero is built around one simple question: what should you watch right now?
          Explore movies and TV series by genre, discover what is trending, or use Cinevero Discover
          for recommendations matched to your mood, time and viewing context.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/discover" className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">
            Try Cinevero Discover
          </Link>
          <Link href="/genres" className="rounded-lg border border-white/15 px-4 py-2 text-zinc-300 hover:border-white/30 hover:text-white">
            Browse genres
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {faqs.map((faq) => (
            <article key={faq.question}>
              <h3 className="text-sm font-semibold text-zinc-200">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
