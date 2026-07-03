"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="text-xl font-bold tracking-[-0.02em]">Something went wrong</h1>
      <p className="text-sm leading-6 text-muted">
        An unexpected error occurred. Your data is safe — try again, and if it keeps happening let us know.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-full bg-ink px-6 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-85"
      >
        Try again
      </button>
    </main>
  );
}
