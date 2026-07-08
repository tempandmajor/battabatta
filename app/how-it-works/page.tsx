import type { Metadata } from "next";
import Link from "next/link";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "How It Works · Battarbox",
  description:
    "Learn how Battarbox posts, offers, messaging, safety tools, and platform support payments work."
};

const steps = [
  {
    title: "Publish or browse",
    body:
      "Create a post for something you are offering or seeking, or browse public listings by local, online, goods, services, and search filters."
  },
  {
    title: "Make a non-binding offer",
    body:
      "Describe what you can give, what you are requesting, and timing. Offers are conversation records, not contracts or payments."
  },
  {
    title: "Coordinate in messages",
    body:
      "Use private messages to clarify details. Share exact meeting information only when you are comfortable and never in public posts."
  },
  {
    title: "Use safety tools",
    body:
      "Report prohibited listings, block members when needed, and avoid regulated goods, payments between members, and services requiring verification."
  }
] as const;

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
      <section className="max-w-3xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">How it works</p>
        <h1 className="mt-3 text-4xl font-bold leading-none tracking-[-0.04em]">
          A simple workflow for safer barter conversations
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted">
          Battarbox is a discovery and messaging platform. Members decide whether an exchange makes sense, but the app
          keeps payment, escrow, settlement, and ranking boosts out of the barter flow.
        </p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-xl border border-line bg-white p-5">
            <span className="text-xs font-semibold text-muted">Step {index + 1}</span>
            <h2 className="mt-2 text-lg font-bold tracking-[-0.02em]">{step.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{step.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-bold tracking-[-0.02em]">What Battarbox does not do</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Battarbox does not process member-to-member payments, hold escrow, value trades, verify licenses, ship
            items, guarantee exchanges, or resolve disputes. Members are responsible for their own decisions.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-bold tracking-[-0.02em]">What is prohibited</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Weapons, drugs, regulated medical products, adult sexual content, financial products, gambling,
            counterfeit goods, illegal activity, and payment-based exchanges are not allowed.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-line bg-white p-5">
        <h2 className="text-lg font-bold tracking-[-0.02em]">Helpful guides</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          These guides show how to write specific posts, stay within safety boundaries, and understand the kinds of
          exchanges that work well on Battarbox.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/guides/good-posts" className={secondaryButtonClass}>
            Good post guide
          </Link>
          <Link href="/guides/safety-checklist" className={secondaryButtonClass}>
            Safety checklist
          </Link>
          <Link href="/guides/community-examples" className={secondaryButtonClass}>
            Community examples
          </Link>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className={primaryButtonClass}>
          Browse offers
        </Link>
        <Link href="/legal/prohibited-items" className={secondaryButtonClass}>
          Prohibited items
        </Link>
      </div>
    </main>
  );
}
