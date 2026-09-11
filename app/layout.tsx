import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import AgeGate from '@/components/AgeGate';
import LegalFooter from '@/components/LegalFooter';

const GOOGLE_SITE_VERIFICATION = 'WkXRsZNaG77qk0yXebhvc_3VAHqFVP7NsvdVhtFSO5A';

export const metadata: Metadata = {
  metadataBase: new URL('https://elovex.vercel.app'),
  title: { default: 'Elovex – Free Adult Videos, Porn Videos & Trending Clips', template: '%s | Elovex' },
  description: 'Discover free adult videos, porn videos, trending clips, popular searches, and fresh daily uploads on Elovex. Browse categories, watch related videos, and find new clips fast.',
  keywords: ['Elovex', 'free adult videos', 'porn videos', 'xxx videos', 'trending adult videos', 'new adult videos', 'amateur videos', 'couples videos', 'webcam videos', 'adult video categories', 'watch adult videos'],
  applicationName: 'Elovex',
  alternates: { canonical: '/', languages: { en: '/', 'x-default': '/' } },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  other: { rating: 'adult', 'rating:content': 'adult' },
  openGraph: {
    title: 'Elovex – Free Adult Videos, Porn Videos & Trending Clips',
    description: 'Discover free adult videos, porn videos, trending clips, and fresh daily uploads on Elovex.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elovex – Free Adult Videos, Porn Videos & Trending Clips',
    description: 'Discover free adult videos, porn videos, trending clips, and fresh daily uploads on Elovex.',
  },
  verification: { google: GOOGLE_SITE_VERIFICATION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AnalyticsTracker />
        <AgeGate />
        {children}
        <LegalFooter />
      </body>
    </html>
  );
}
