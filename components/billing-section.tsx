"use client";

import { useState } from "react";
import Link from "next/link";
import { secondaryButtonClass } from "@/components/ui";
import { nonprofit } from "@/lib/nonprofit";

export function BillingSection({
  subscriptionStatus,
  hasStripeCustomer
}: {
  subscriptionStatus: string;
  hasStripeCustomer: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Could not open the billing portal");
      window.location.href = payload.url;
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "Could not open the billing portal");
      setPending(false);
    }
  }

  return (
    <section className="mt-12 space-y-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">
        Recurring platform support
      </h2>
      {subscriptionStatus === "active" || subscriptionStatus === "trialing" ? (
        <div className="space-y-3 rounded-xl border border-line p-4">
          <p className="text-[13px] leading-6 text-ink">
            <span className="font-semibold">Thank you for supporting Battarbox operations.</span> Recurring support
            funds hosting, moderation, accessibility, and safety work through {nonprofit.publicName}. It never buys
            access, listing priority, ranking preference, matches, or exchange privileges.
          </p>
          <p className="rounded-lg bg-mist px-3 py-2 text-xs font-medium leading-5 text-ink">
            {nonprofit.paymentDisclosure}
          </p>
          <button onClick={openPortal} disabled={pending} className={secondaryButtonClass}>
            {pending ? "Opening..." : "Manage billing"}
          </button>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-line p-4">
          <p className="text-[13px] leading-6 text-muted">
            Battarbox is free. If it is useful to you, consider{" "}
            <Link href="/support" className="font-semibold text-ink hover:underline">
              monthly platform support for {nonprofit.supporterAmountLabel}
            </Link>
            .
          </p>
          {hasStripeCustomer && (
            <p className="rounded-lg bg-mist px-3 py-2 text-xs font-medium leading-5 text-ink">
              {nonprofit.paymentDisclosure}
            </p>
          )}
          {hasStripeCustomer && (
            <button onClick={openPortal} disabled={pending} className={secondaryButtonClass}>
              {pending ? "Opening..." : "Billing history"}
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
    </section>
  );
}
