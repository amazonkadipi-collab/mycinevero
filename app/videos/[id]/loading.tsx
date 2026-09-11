export default function VideoLoading() {
  return (
    <main className="min-h-screen bg-zinc-900 text-gray-200">
      <header className="border-b border-red-950/80 bg-red-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="h-5 w-28 animate-pulse rounded bg-red-700" />
          <div className="h-4 w-20 animate-pulse rounded bg-red-700" />
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-xl">
          <div className="aspect-video animate-pulse bg-zinc-800" />
        </div>
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="h-7 w-2/3 animate-pulse rounded bg-zinc-800" />
          <div className="mt-5 h-4 w-1/3 animate-pulse rounded bg-zinc-800" />
          <div className="mt-5 h-16 w-full animate-pulse rounded bg-zinc-900" />
        </div>
      </div>
    </main>
  );
}
