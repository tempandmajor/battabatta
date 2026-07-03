"use client";

import { useState } from "react";
import Link from "next/link";
import { secondaryButtonClass } from "@/components/ui";

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
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">Supporter membership</h2>
      {subscriptionStatus === "active" || subscriptionStatus === "trialing" ? (
        <div className="space-y-3 rounded-xl border border-line p-4">
          <p className="text-[13px] leading-6 text-ink">
            <span className="font-semibold">You are a supporter — thank you!</span> Your membership funds hosting,
            moderation, and safety work. It never buys placement or settles trades.
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
              supporting the platform
            </Link>
            .
          </p>
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
