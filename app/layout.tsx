import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import AgeGate from '@/components/AgeGate';

const GOOGLE_SITE_VERIFICATION = 'WkXRsZNaG77qk0yXebhvc_3VAHqFVP7NsvdVhtFSO5A';

export const metadata: Metadata = {
  metadataBase: new URL('https://elovex.vercel.app'),
  title: { default: 'Elovex – Free Adult Videos & Trending Clips', template: '%s | Elovex' },
  description: 'Discover free adult videos, trending clips, popular searches, and fresh daily entertainment on Elovex. Fast browsing, related videos, and dedicated watch pages.',
  keywords: ['Elovex', 'free adult videos', 'adult video search', 'trending adult videos', 'popular videos', 'watch videos online', 'new videos daily'],
  openGraph: {
    title: 'Elovex – Free Adult Videos & Trending Clips',
    description: 'Discover free adult videos, trending clips, and fresh daily entertainment on Elovex.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elovex – Free Adult Videos & Trending Clips',
    description: 'Discover free adult videos, trending clips, and fresh daily entertainment on Elovex.',
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
      </body>
    </html>
  );
}
