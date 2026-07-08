import type { Metadata } from "next";
import Link from "next/link";
import { secondaryButtonClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "Good Post Guide · Battarbox",
  description:
    "How to write clear, useful, policy-safe barter posts on Battarbox."
};

const examples = [
  {
    title: "Clear goods offer",
    good: "Two cedar planter boxes, 24 x 12 inches, built this spring. Looking for herb seedlings or hand tools.",
    weak: "Stuff for trade."
  },
  {
    title: "Clear service offer",
    good: "One 45-minute beginner guitar lesson over video. Best for first-time players learning chords and tuning.",
    weak: "I can teach music."
  },
  {
    title: "Clear seeking post",
    good: "Seeking help moving a desk upstairs this Saturday morning. I can offer a home-cooked meal or two hours of yard help.",
    weak: "Need help."
  }
] as const;

export default function GoodPostGuidePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
      <section className="max-w-3xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Guide</p>
        <h1 className="mt-3 text-4xl font-bold leading-none tracking-[-0.04em]">
          How to write a useful barter post
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted">
          A strong Battarbox post helps another person quickly understand what is being offered or requested, where it
          can happen, and what a fair exchange might look like. Specific posts are easier to trust, easier to search,
          and easier for moderators to review.
        </p>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <article className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-bold tracking-[-0.02em]">Include the practical details</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Mention condition, size, timing, skill level, pickup area, online availability, and what would make the
            trade feel fair. Keep exact addresses and private contact details out of public posts.
          </p>
        </article>
        <article className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-bold tracking-[-0.02em]">Keep it policy-safe</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Do not post weapons, drugs, regulated medical products, adult services, financial products, gambling,
            illegal services, counterfeit goods, or anything requiring payment between members.
          </p>
        </article>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-bold tracking-[-0.03em]">Examples</h2>
        {examples.map((example) => (
          <article key={example.title} className="rounded-xl border border-line bg-white p-5">
            <h3 className="text-lg font-bold tracking-[-0.02em]">{example.title}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <p className="rounded-lg bg-mist p-4 text-sm leading-7">
                <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-muted">Better</span>
                {example.good}
              </p>
              <p className="rounded-lg border border-line p-4 text-sm leading-7 text-muted">
                <span className="block text-xs font-semibold uppercase tracking-[0.08em]">Too vague</span>
                {example.weak}
              </p>
            </div>
          </article>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/posts/new" className={secondaryButtonClass}>
          Create a post
        </Link>
        <Link href="/legal/prohibited-items" className={secondaryButtonClass}>
          Review prohibited items
        </Link>
      </div>
    </main>
  );
}
