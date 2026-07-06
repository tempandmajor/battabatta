"use client";

import { useState } from "react";
import { CircleDollarSign, LockKeyhole } from "lucide-react";
import { nonprofit } from "@/lib/nonprofit";
import { cn } from "@/lib/utils";

export function SupportPanel({ isSignedIn }: { isSignedIn: boolean }) {
  const [amount, setAmount] = useState(10);
  const [pending, setPending] = useState<"donation" | "supporter" | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(mode: "donation" | "supporter") {
    setPending(mode);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, amount: amount * 100 })
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Could not open Stripe");
      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not open Stripe");
      setPending(null);
    }
  }

  return (
    <div id="donate" className="scroll-mt-24 rounded-2xl border border-line p-5">
      <CircleDollarSign size={20} aria-hidden />
      <h2 className="mt-4 text-xl font-bold tracking-[-0.02em]">Support OMS2</h2>
      <p className="mt-2 text-xs leading-5 text-muted">
        Help fund Battarbox operations through optional platform support payments to {nonprofit.publicName}.
      </p>
      <p className="mt-4 rounded-xl border border-line bg-mist px-3.5 py-3 text-xs font-medium leading-5 text-ink">
        {nonprofit.paymentDisclosure}
      </p>
      <p className="mt-1.5 block text-[13px] font-semibold" id="amount-label">
        One-time amount
      </p>
      <div className="mt-2 flex gap-2" role="group" aria-labelledby="amount-label">
        {[5, 10, 25].map((value) => (
          <button
            key={value}
            onClick={() => setAmount(value)}
            aria-pressed={amount === value}
            className={cn(
              "rounded-full border px-4 py-2 text-[13px] font-semibold",
              amount === value ? "border-ink bg-ink text-white" : "border-line"
            )}
          >
            ${value}
          </button>
        ))}
      </div>
      <button
        onClick={() => startCheckout("donation")}
        disabled={pending !== null}
        className="mt-5 w-full rounded-full bg-ink py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending === "donation" ? "Opening Stripe..." : "Donate to OMS2"}
      </button>
      <button
        onClick={() => startCheckout("supporter")}
        disabled={pending !== null}
        className="mt-3 w-full rounded-full border border-ink py-3 text-sm font-semibold disabled:opacity-50"
        title={isSignedIn ? undefined : "Sign in to become a supporter"}
      >
        {pending === "supporter" ? "Opening Stripe..." : `Start monthly platform support · ${nonprofit.supporterAmountLabel}`}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
      <p className="mt-4 text-xs leading-5 text-muted">
        Support payments are processed securely by Stripe. Monthly support never buys listing boosts, ranking preference,
        guaranteed matches, exchange privileges, or payments to other members.
      </p>
    </div>
  );
}

export function SupportHighlights() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {["Free core access", "No barter settlement", "$10.99 monthly support"].map((item) => (
        <div key={item} className="rounded-[14px] border border-line p-4 text-sm font-semibold">
          <LockKeyhole className="mb-4" size={18} aria-hidden />
          {item}
        </div>
      ))}
    </div>
  );
}
