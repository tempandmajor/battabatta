export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8" aria-busy>
      <div className="h-10 w-64 animate-pulse rounded-lg bg-mist" />
      <div className="mt-4 h-4 w-80 animate-pulse rounded bg-mist" />
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-2xl border border-line bg-mist/60" />
        ))}
      </div>
    </main>
  );
}
