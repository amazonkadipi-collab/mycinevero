import type { Metadata } from 'next';
import './globals.css';
import LegalFooter from '@/components/LegalFooter';
import SiteHeader from '@/components/SiteHeader';
import VercelAnalyticsScript from '@/components/VercelAnalyticsScript';
import VignetteAd from '@/components/VignetteAd';

const GOOGLE_SITE_VERIFICATION = 'WkXRsZNaG77qk0yXebhvc_3VAHqFVP7NsvdVhtFSO5A';
const BING_SITE_VERIFICATION = '84783D6C29D7BA1FE3D5503CF8ABF55D';
const YANDEX_SITE_VERIFICATION = '512bbf7efb34a7ed';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
const ADSENSE_ACCOUNT = 'ca-pub-2298621556332463';
const MONETAG_SITE_ID = '057cd6503f2f1a010d02b22b8f61b95f';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Cinevero – Movies & TV Series Discovery', template: '%s | Cinevero' },
  description: 'Discover movies and TV series with Cinevero: mood-based discovery, trending titles, popular picks, genres, trailers and detailed movie pages.',
  applicationName: 'Cinevero',
  keywords: ['Cinevero', 'movies', 'TV series', 'films', 'movie discovery', 'what to watch', 'movie recommendations', 'trailers'],
  alternates: { canonical: '/', languages: { en: '/', 'x-default': '/' } },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  openGraph: { title: 'Cinevero – Movies & TV Series Discovery', description: 'Decide what to watch with Cinevero: explore movies and series by mood, time, genre and more.', type: 'website', url: SITE_URL, siteName: 'Cinevero' },
  twitter: { card: 'summary_large_image', title: 'Cinevero – Movies & TV Series Discovery', description: 'Discover what to watch with Cinevero.' },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
    other: {
      'msvalidate.01': BING_SITE_VERIFICATION,
      'yandex-verification': YANDEX_SITE_VERIFICATION,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content={ADSENSE_ACCOUNT} />
        <meta name="monetag" content={MONETAG_SITE_ID} />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ACCOUNT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>
        <VercelAnalyticsScript />
        <SiteHeader />
        {children}
        <VignetteAd />
        <LegalFooter />
      </body>
    </html>
  );
}
