import type { Metadata } from 'next';
import './globals.css';
import LegalFooter from '@/components/LegalFooter';

const GOOGLE_SITE_VERIFICATION = 'xWD_h_owizc_wuZTFwNy4hCe0t09WB7Z0r4uu-wQSG4';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://watchmovies4.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Cinevero – Movies & TV Series Discovery',
    template: '%s | Cinevero',
  },
  description: 'Discover movies and TV series with Cinevero: trending titles, popular picks, genres, trailers and detailed movie pages.',
  applicationName: 'Cinevero',
  keywords: ['Cinevero', 'movies', 'TV series', 'films', 'movie discovery', 'movie catalogue', 'trailers'],
  alternates: {
    canonical: '/',
    languages: { en: '/', 'x-default': '/' },
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
  },
  openGraph: {
    title: 'Cinevero – Movies & TV Series Discovery',
    description: 'Discover movies and TV series, explore genres, ratings, trailers and related titles.',
    type: 'website',
    url: SITE_URL,
    siteName: 'Cinevero',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cinevero – Movies & TV Series Discovery',
    description: 'Discover movies and TV series, explore genres, ratings, trailers and related titles.',
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}<LegalFooter /></body>
    </html>
  );
}
