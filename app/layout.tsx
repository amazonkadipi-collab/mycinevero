import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import LegalFooter from '@/components/LegalFooter';

const GOOGLE_SITE_VERIFICATION = 'WkXRsZNaG77qk0yXebhvc_3VAHqFVP7NsvdVhtFSO5A';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://watchmovies4.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Watch Movies 4 – Movies & Series', template: '%s | Watch Movies 4' },
  description: 'Discover movies and TV series with a fast, clean, responsive catalogue.',
  keywords: ['Watch Movies 4', 'movies', 'series', 'TV shows', 'movie catalogue'],
  applicationName: 'Watch Movies 4',
  alternates: { canonical: '/', languages: { en: '/', 'x-default': '/' } },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  openGraph: {
    title: 'Watch Movies 4 – Movies & Series',
    description: 'Discover movies and TV series with a fast, clean, responsive catalogue.',
    type: 'website',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watch Movies 4 – Movies & Series',
    description: 'Discover movies and TV series with a fast, clean, responsive catalogue.',
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
