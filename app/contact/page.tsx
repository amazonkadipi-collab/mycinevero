import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contact', description: 'Contact Elovex about privacy, copyright, safety, or site issues.' };

export default function ContactPage() {
  return <main className="mx-auto max-w-3xl px-5 py-12 text-zinc-800"><h1 className="text-3xl font-bold">Contact Elovex</h1><section className="prose prose-zinc mt-8 max-w-none"><p>For privacy requests, copyright notices, safety concerns, broken pages, or general questions, send a message through the contact channel configured by the site operator.</p><h2>What to include</h2><p>Include the relevant URL, a concise description, and the action you are requesting. Avoid sending passwords, payment details, or more personal information than necessary.</p><h2>Response times</h2><p>We aim to review valid reports promptly. Urgent safety and minor-related reports should be clearly marked “Urgent report”.</p><p className="text-sm text-zinc-500">The site operator should replace this page with a monitored email address or contact form before public launch. This placeholder does not itself create a monitored communications channel.</p></section></main>;
}
