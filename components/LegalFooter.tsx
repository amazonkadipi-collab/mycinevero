import Link from 'next/link';

export default function LegalFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 px-4 py-10 text-sm text-zinc-600">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="font-black tracking-tight text-zinc-900">CINE<span className="text-red-600">VERO</span></Link>
            <p className="mt-1 text-xs text-zinc-500">Movies & TV series discovery.</p>
          </div>
          <nav aria-label="Legal links" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-red-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-red-600">Terms</Link>
            <Link href="/dmca" className="hover:text-red-600">DMCA / Report</Link>
            <Link href="/contact" className="hover:text-red-600">Contact</Link>
          </nav>
        </div>
        <p className="text-xs leading-5 text-zinc-500">© {new Date().getFullYear()} Cinevero. Metadata and images are provided by third-party services. Cinevero does not host movie or TV video files.</p>
        <div className="border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-500">
          <p>
            This product uses the TMDB API but is not endorsed or certified by TMDB.
            {' '}
            <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="font-medium text-zinc-700 hover:text-red-600">The Movie Database (TMDB)</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
