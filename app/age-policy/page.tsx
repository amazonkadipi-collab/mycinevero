import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Age Policy', description: 'Elovex age policy and access requirements for age-restricted content.' };

export default function AgePolicyPage() {
  return <main className="mx-auto max-w-3xl px-5 py-12 text-zinc-800"><h1 className="text-3xl font-bold">Age Policy</h1><section className="prose prose-zinc mt-8 max-w-none"><h2>Adults only</h2><p>Elovex is intended only for adults who meet the legal age requirement in their location. Minors must not access or use the site.</p><h2>Age confirmation</h2><p>When you first visit, the site asks whether you are 18 or older. This is an access notice and is not a substitute for a legally required age-verification system where one applies.</p><h2>Parents and guardians</h2><p>Parents and guardians should use device-level parental controls and monitoring tools to help prevent minors from accessing age-restricted material.</p><h2>Report a concern</h2><p>If you believe a minor appears in content, or that age-restricted content is accessible unlawfully, report it immediately through <a href="/dmca">DMCA / Report</a>.</p><p className="text-sm text-zinc-500">Requirements differ by jurisdiction. Obtain local legal advice before relying on this policy.</p></section></main>;
}
