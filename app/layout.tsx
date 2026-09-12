import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import LegalFooter from '@/components/LegalFooter';

const GOOGLE_SITE_VERIFICATION = 'WkXRsZNaG77qk0yXebhvc_3VAHqFVP7NsvdVhtFSO5A';

export const metadata: Metadata = {
  metadataBase: new URL('https://elovex.vercel.app'),
  title: { default: 'Elovex – Video Discovery', template: '%s | Elovex' },
  description: 'Discover videos, trending clips, popular searches, and fresh uploads on Elovex.',
  keywords: ['Elovex', 'video discovery', 'videos', 'trending videos', 'new videos', 'video search'],
  applicationName: 'Elovex',
  alternates: { canonical: '/', languages: { en: '/', 'x-default': '/' } },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  openGraph: {
    title: 'Elovex – Video Discovery',
    description: 'Discover videos, trending clips, popular searches, and fresh uploads on Elovex.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elovex – Video Discovery',
    description: 'Discover videos, trending clips, popular searches, and fresh uploads on Elovex.',
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
