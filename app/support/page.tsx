import type { Metadata } from "next";
import { SupportHighlights, SupportPanel } from "@/components/support-panel";
import { getSessionUser } from "@/lib/auth";

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
          Thank you for supporting Battarbox! Your payment was received by Stripe; a receipt is on its way to your
          email.
        </p>
      )}
      {status === "cancelled" && (
        <p role="status" className="mb-8 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted">
          Checkout was cancelled — nothing was charged.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-4xl font-bold leading-none tracking-[-0.04em]">Keep Battarbox free</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
            Give-what-you-can support funds hosting, moderation, accessibility, and safety work. Donations and
            supporter memberships never buy placement in barter discovery and never pay another user for an exchange.
          </p>
          <SupportHighlights />
        </div>
        <SupportPanel isSignedIn={Boolean(user)} />
      </div>
    </main>
  );
}
