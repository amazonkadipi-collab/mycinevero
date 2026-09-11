import type { Metadata } from 'next';
import VideoPortalPage from '../page';

const SITE_URL = 'https://elovex.vercel.app';

export const metadata: Metadata = {
  title: 'Vidéos pour adultes en français',
  description: 'Découvrez des vidéos pour adultes, des catégories populaires et des pages de visionnage rapides sur Elovex.',
  alternates: {
    canonical: `${SITE_URL}/fr`,
    languages: { en: SITE_URL, fr: `${SITE_URL}/fr`, 'x-default': SITE_URL },
  },
  openGraph: { title: 'Vidéos pour adultes en français | Elovex', description: 'Explorez les catégories et les vidéos disponibles sur Elovex.', url: `${SITE_URL}/fr`, type: 'website' },
};

export default function FrenchLandingPage() {
  return <main lang="fr"><section className="mx-auto max-w-[1400px] px-4 pb-2 pt-6 lg:px-6"><h1 className="text-2xl font-bold text-zinc-900">Vidéos pour adultes en français</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Explorez des vidéos récentes et des catégories populaires avec une navigation rapide, des pages de visionnage dédiées et des contenus fournis par notre source vidéo.</p></section><VideoPortalPage initialOrder="latest" /></main>;
}
