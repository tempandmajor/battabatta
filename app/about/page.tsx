import type { Metadata } from "next";
import Link from "next/link";
import { nonprofit } from "@/lib/nonprofit";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "About · Battarbox",
  description:
    "Battarbox is a free community barter discovery and messaging platform operated by OMS2."
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
      <section className="max-w-3xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">About Battarbox</p>
        <h1 className="mt-3 text-4xl font-bold leading-none tracking-[-0.04em]">
          Free-first barter discovery for local and online exchanges
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted">
          Battarbox helps adults publish what they can offer, find what they need, and start non-binding
          member-to-member barter conversations. The platform is operated by {nonprofit.publicName} and is designed
          around safety, clear boundaries, and no user-to-user payments.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/" className={primaryButtonClass}>
            Browse offers
          </Link>
          <Link href="/how-it-works" className={secondaryButtonClass}>
            How it works
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-3">
        <article className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-bold tracking-[-0.02em]">Community listings</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Members create goods or services posts, add approximate location context, and decide whether exchanges are
            local, online, or both.
          </p>
        </article>
        <article className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-bold tracking-[-0.02em]">Non-binding offers</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Offers and messages are planning tools. Battarbox is not escrow, settlement, valuation, shipping,
            completion accounting, or dispute resolution.
          </p>
        </article>
        <article className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-bold tracking-[-0.02em]">Safety boundaries</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Adults-only onboarding, reports, blocks, prohibited-item rules, and moderator tools keep risky exchanges
            out of public discovery.
          </p>
        </article>
      </section>

      <section className="mt-10 max-w-3xl rounded-xl border border-line bg-white p-5">
        <h2 className="text-lg font-bold tracking-[-0.02em]">Advertising boundary</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Battarbox may show clearly labeled third-party ads after review and approval. Ads never buy member listing
          rank, exchange access, profile status, or barter placement. Optional support payments fund platform
          operations only.
        </p>
      </section>
    </main>
  );
}
