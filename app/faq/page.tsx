import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Cinevero",
  description: "Frequently asked questions about Cinevero, privacy, accounts, OTP, analytics, third-party metadata and movie discovery.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  ["Do I need an account to use Cinevero?", "No. Cinevero is designed for public movie and TV discovery without requiring an account, registration or login."],
  ["Does Cinevero use OTP, passwords or verification codes?", "No. Cinevero does not require OTP codes, passwords or phone verification to browse and use the public discovery experience."],
  ["Do you store my name, email or payment information?", "Cinevero does not ask visitors for names, passwords, payment-card details or other account information just to browse the site. The public site has no checkout or account-registration flow."],
  ["Does Cinevero collect analytics?", "Yes, limited technical and aggregated analytics may be processed to understand site traffic and reliability. This can include page views, visitor counts, country, referrer hostname, browser and device type. The admin dashboard uses aggregated Web Analytics dimensions rather than displaying individual identities."],
  ["Can Cinevero identify me personally from its analytics dashboard?", "The Cinevero admin dashboard is designed around aggregated traffic reports. It does not expose a visitor name, account profile or personal identity. Technical processing by infrastructure or analytics providers is governed by their own policies."],
  ["Where does movie and TV metadata come from?", "Cinevero uses third-party metadata services, including TMDB, to provide titles, posters, backdrops, ratings and other catalogue information. Cinevero is not endorsed or certified by TMDB."],
  ["Does Cinevero host movie or TV video files?", "Cinevero does not host movie or TV video files. Pages may display third-party trailers, embeds or links supplied by external services."],
  ["Can I report copyright or other content issues?", "Yes. Use the DMCA / Report page for copyright notices and the Contact page for general, privacy, safety or site issues."],
  ["Does Cinevero guarantee that a page will appear in Google Search?", "No website can guarantee indexing or a particular ranking position. Cinevero uses clear metadata, canonical URLs, sitemaps, Search Console tooling and other technical best practices to help search engines understand the site."],
  ["Does Cinevero sell personal data?", "Cinevero does not operate a business model based on selling visitor personal information. For the exact technical processing and third-party providers, see the Privacy Policy."],
];

export default function FAQPage() {
  return <main className="min-h-screen bg-[#fbfaf7] text-zinc-900"><div className="mx-auto max-w-4xl px-5 py-14 sm:px-8"><div className="mb-10"><div className="text-xs font-black uppercase tracking-[.2em] text-[#7751ff]">CINEVERO TRUST CENTER</div><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Frequently Asked Questions</h1><p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">Straight answers about how Cinevero works, privacy, analytics, third-party metadata and what information the public site does — and does not — require.</p></div><div className="space-y-4">{faqs.map(([question, answer]) => <section key={question} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">{question}</h2><p className="mt-3 leading-7 text-zinc-600">{answer}</p></section>)}</div><div className="mt-10 flex flex-wrap gap-3 text-sm font-bold"><a href="/privacy-policy" className="rounded-xl bg-zinc-900 px-4 py-2.5 text-white">Privacy Policy</a><a href="/terms" className="rounded-xl border border-zinc-200 px-4 py-2.5">Terms</a><a href="/dmca" className="rounded-xl border border-zinc-200 px-4 py-2.5">DMCA / Report</a><a href="/contact" className="rounded-xl border border-zinc-200 px-4 py-2.5">Contact</a></div></div></main>;
}
