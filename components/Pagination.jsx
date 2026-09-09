'use client';

export default function Pagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <button type="button" disabled={currentPage <= 1} onClick={() => onChange(currentPage - 1)} className="rounded border border-zinc-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-800">Previous</button>
      <span className="px-3 text-sm text-zinc-400">Page {currentPage} of {totalPages}</span>
      <button type="button" disabled={currentPage >= totalPages} onClick={() => onChange(currentPage + 1)} className="rounded border border-zinc-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-800">Next</button>
    </nav>
  );
}
