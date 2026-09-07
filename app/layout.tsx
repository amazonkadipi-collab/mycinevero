import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Video Portal',
  description: 'A single-page video search and playback portal with embedded player modal, search, and pagination.',
  openGraph: {
    title: 'Video Portal',
    description: 'A single-page video search and playback portal with embedded player modal, search, and pagination.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Portal',
    description: 'A single-page video search and playback portal with embedded player modal, search, and pagination.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
