import Link from 'next/link';

export default function LegalFooter() {
  return (
    <footer className="border-t border-[#d9edf4] bg-[#102d43] px-4 py-10 text-sm text-[#cfe7ef]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="font-black tracking-tight text-white">CINE<span className="text-[#168aad]">VERO</span><span className="ml-1 text-[10px] align-top text-[#ff6b4a]">✦</span></Link>
            <p className="mt-1 text-xs text-[#9fc0cc]">Decide what to watch.</p>
          </div>
          <nav aria-label="Cinevero information and legal links" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/guides" className="hover:text-white">Guides</Link>
            <Link href="/faq" className="hover:text-white">FAQ</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/dmca" className="hover:text-white">DMCA / Report</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </nav>
        </div>
        <p className="text-xs leading-5 text-[#9fc0cc]">
          © {new Date().getFullYear()} Cinevero. No account, OTP, password or payment information is required to browse the public site. Limited technical and aggregated analytics may be processed for traffic, reliability and security. Metadata and images are provided by third-party services. Cinevero does not host movie or TV video files.
        </p>
        <div className="border-t border-white/10 pt-4 text-xs leading-5 text-[#9fc0cc]">
          <p>This product uses the TMDB API but is not endorsed or certified by TMDB. <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="font-medium text-[#d7edf4] hover:text-white">The Movie Database (TMDB)</a></p>
        </div>
      </div>
    </footer>
  );
}
