import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import LegalFooter from '@/components/LegalFooter';

const GOOGLE_SITE_VERIFICATION = 'WkXRsZNaG77qk0yXebhvc_3VAHqFVP7NsvdVhtFSO5A';

export const metadata: Metadata = {
  metadataBase: new URL('https://elovex.vercel.app'),
  title: { default: 'Elovex – Movies and Series Streaming', template: '%s | Elovex' },
  description: 'Discover movies and series in a fast, clean, responsive interface.',
  keywords: ['Elovex', 'movies', 'series', 'streaming', 'movie catalogue', 'TV series'],
  applicationName: 'Elovex',
  alternates: { canonical: '/', languages: { en: '/', 'x-default': '/' } },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  openGraph: {
    title: 'Elovex – Movies and Series Streaming',
    description: 'Discover movies and series in a fast, clean, responsive interface.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elovex – Movies and Series Streaming',
    description: 'Discover movies and series in a fast, clean, responsive interface.',
  },
  verification: { google: GOOGLE_SITE_VERIFICATION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AnalyticsTracker />
        {children}
        <LegalFooter />
      </body>
    </html>
  );
}
