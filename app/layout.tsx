import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { getPortalSettings } from '@/lib/site-settings';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPortalSettings();
  return {
    metadataBase: new URL('https://elovex.vercel.app'),
    title: { default: 'Elovex – Free Adult Videos & Trending Clips', template: '%s | Elovex' },
    description: 'Discover free adult videos, trending clips, popular searches, and fresh daily entertainment on Elovex. Fast browsing, related videos, and dedicated watch pages.',
    keywords: ['Elovex', 'free adult videos', 'adult video search', 'trending adult videos', 'popular videos', 'watch videos online', 'new videos daily'],
    openGraph: { title: 'Elovex – Free Adult Videos & Trending Clips', description: 'Discover free adult videos, trending clips, and fresh daily entertainment on Elovex.', type: 'website' },
    twitter: { card: 'summary_large_image', title: 'Elovex – Free Adult Videos & Trending Clips', description: 'Discover free adult videos, trending clips, and fresh daily entertainment on Elovex.' },
    other: {
      ...(settings.google_site_verification ? { 'google-site-verification': settings.google_site_verification } : {}),
      ...(settings.bing_site_verification ? { 'msvalidate.01': settings.bing_site_verification } : {}),
      ...(settings.yandex_site_verification ? { 'yandex-verification': settings.yandex_site_verification } : {}),
      ...(settings.naver_site_verification ? { 'naver-site-verification': settings.naver_site_verification } : {}),
      ...(settings.baidu_site_verification ? { 'baidu-site-verification': settings.baidu_site_verification } : {}),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body suppressHydrationWarning><AnalyticsTracker />{children}</body></html>;
}
