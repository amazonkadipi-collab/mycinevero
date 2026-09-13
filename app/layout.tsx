import type { Metadata } from 'next';
import './globals.css';
import LegalFooter from '@/components/LegalFooter';
import SiteHeader from '@/components/SiteHeader';
import VercelAnalyticsScript from '@/components/VercelAnalyticsScript';

const GOOGLE_SITE_VERIFICATION = 'WkXRsZNaG77qk0yXebhvc_3VAHqFVP7NsvdVhtFSO5A';
const BING_SITE_VERIFICATION = '84783D6C29D7BA1FE3D5503CF8ABF55D';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';

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
    other: { 'msvalidate.01': BING_SITE_VERIFICATION },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body suppressHydrationWarning><VercelAnalyticsScript /><SiteHeader />{children}<LegalFooter /></body></html>;
}
