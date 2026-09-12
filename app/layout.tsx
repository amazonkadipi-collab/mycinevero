import type { Metadata } from 'next';
import './globals.css';
import LegalFooter from '@/components/LegalFooter';

const GOOGLE_SITE_VERIFICATION = 'xWD_h_owizc_wuZTFwNy4hCe0t09WB7Z0r4uu-wQSG4';
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
  verification: { google: GOOGLE_SITE_VERIFICATION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body suppressHydrationWarning>{children}<LegalFooter /></body></html>;
}
