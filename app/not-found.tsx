import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center text-zinc-800">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Cinevero</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Page not found</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600">
        This page may have moved, the title may no longer be available, or the address may be incorrect. You can continue exploring movies and TV series from the discovery pages below.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700">Home</Link>
        <Link href="/discover" className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50">Discover</Link>
        <Link href="/guides" className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50">Guides</Link>
      </div>
    </main>
  );
}
