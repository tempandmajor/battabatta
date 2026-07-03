import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-6xl font-bold tracking-[-0.04em]">404</p>
      <h1 className="text-xl font-bold tracking-[-0.02em]">This page does not exist</h1>
      <p className="text-sm leading-6 text-muted">
        The post may have been removed by its owner, or the link is wrong.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-ink px-6 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-85"
      >
        Back to Discover
      </Link>
    </main>
  );
}
