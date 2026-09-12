import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Watch Movies 4 about privacy, copyright, safety, or site issues.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-zinc-800">
      <h1 className="text-3xl font-bold">Contact Watch Movies 4</h1>
      <section className="prose prose-zinc mt-8 max-w-none">
        <p>For privacy requests, copyright notices, safety concerns, broken pages, or general questions, use the contact channel configured by the site operator.</p>
        <h2>What to include</h2>
        <p>Include the relevant URL, a concise description, and the action you are requesting. Avoid sending passwords, payment details, or more personal information than necessary.</p>
        <h2>Response times</h2>
        <p>Valid reports are reviewed as promptly as reasonably possible. Urgent safety and minor-related reports should be clearly marked “Urgent report”.</p>
        <p className="text-sm text-zinc-500">A monitored email address or contact form must be configured by the site operator before this page can serve as a live communications channel.</p>
      </section>
    </main>
  );
}
