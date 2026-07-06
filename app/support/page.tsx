import type { Metadata } from "next";
import Link from "next/link";
import { SupportHighlights, SupportPanel } from "@/components/support-panel";
import { primaryButtonClass } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { nonprofit } from "@/lib/nonprofit";

export const metadata: Metadata = { title: "Support · Battarbox" };

export default async function SupportPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { user } = await getSessionUser();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
      {status === "success" && (
        <p role="status" className="mb-8 rounded-xl border border-ink bg-mist px-4 py-3 text-sm font-semibold">
          Thank you for supporting OMS2's operation of Battarbox. This payment supports platform operations only. It
          is not payment for a barter exchange, listing boost, escrow service, stored value, or payment to another
          member.
        </p>
      )}
      {status === "cancelled" && (
        <p role="status" className="mb-8 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted">
          The Stripe support payment flow was canceled. Nothing was charged.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-4xl font-bold leading-none tracking-[-0.04em]">Keep Battarbox free</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
            Optional donations and recurring platform support payments fund hosting, moderation, accessibility, safety,
            and community operations for OMS2. They never buy listing boosts, ranking preference, guaranteed matches,
            exchange privileges, or payments to other members.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{nonprofit.businessDescription}</p>
          <div className="mt-6">
            <Link href="#donate" className={primaryButtonClass}>
              Donate to OMS2
            </Link>
          </div>
          <SupportHighlights />
          <section className="mt-8 max-w-2xl rounded-2xl border border-line bg-white p-5">
            <h2 className="text-lg font-bold tracking-[-0.02em]">Refunds and cancellations</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{nonprofit.refundPolicy}</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Questions about support payments:{" "}
              <a href={`mailto:${nonprofit.supportEmail}`} className="font-semibold text-ink hover:underline">
                {nonprofit.supportEmail}
              </a>
              .
            </p>
          </section>
        </div>
        <SupportPanel isSignedIn={Boolean(user)} />
      </div>
    </main>
  );
}
