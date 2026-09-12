import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import LegalFooter from '@/components/LegalFooter';

const GOOGLE_SITE_VERIFICATION = 'WkXRsZNaG77qk0yXebhvc_3VAHqFVP7NsvdVhtFSO5A';

export const metadata: Metadata = {
  metadataBase: new URL('https://elovex.vercel.app'),
  title: { default: 'Elovex – Films et Séries en Streaming', template: '%s | Elovex' },
  description: 'Découvrez des films et des séries dans une interface rapide, simple et responsive.',
  keywords: ['Elovex', 'films', 'séries', 'streaming', 'films en français', 'séries en streaming'],
  applicationName: 'Elovex',
  alternates: { canonical: '/', languages: { en: '/', 'x-default': '/' } },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  openGraph: {
    title: 'Elovex – Films et Séries en Streaming',
    description: 'Découvrez des films et des séries dans une interface rapide, simple et responsive.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elovex – Films et Séries en Streaming',
    description: 'Découvrez des films et des séries dans une interface rapide, simple et responsive.',
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
