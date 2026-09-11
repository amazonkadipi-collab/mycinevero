import Link from 'next/link';

export default function LegalFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 px-4 py-8 text-sm text-zinc-600">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Elovex. All rights reserved.</p>
        <nav aria-label="Legal links" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/privacy-policy" className="hover:text-red-600">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-red-600">Terms</Link>
          <Link href="/age-policy" className="hover:text-red-600">Age Policy</Link>
          <Link href="/dmca" className="hover:text-red-600">DMCA / Report</Link>
          <Link href="/contact" className="hover:text-red-600">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
