import type { Metadata } from "next";
import Link from "next/link";
import { secondaryButtonClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "Barter Safety Checklist · Battarbox",
  description:
    "Safety reminders for public posts, private messages, local meetups, and online barter discussions."
};

const checklist = [
  "Keep exact addresses, door codes, phone numbers, and payment handles out of public posts.",
  "Use Messages to clarify timing and expectations before meeting.",
  "Meet in a public place when possible and tell someone where you are going.",
  "Inspect goods before exchanging them and do not accept recalled, unsafe, or counterfeit items.",
  "Verify licenses, permits, insurance, and credentials yourself for any service that may require them.",
  "Report posts or members that ask for money, deposits, prohibited goods, harassment, or unsafe behavior."
] as const;

export default function SafetyChecklistPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
      <section className="max-w-3xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Safety</p>
        <h1 className="mt-3 text-4xl font-bold leading-none tracking-[-0.04em]">
          Barter safety checklist
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted">
          Battarbox helps people discover possible exchanges, but members are responsible for deciding whether,
          where, and how to meet or trade. Use this checklist before publishing, messaging, or meeting.
        </p>
      </section>

      <section className="mt-10 rounded-xl border border-line bg-white p-5">
        <h2 className="text-lg font-bold tracking-[-0.02em]">Before you exchange</h2>
        <ul className="mt-4 space-y-3">
          {checklist.map((item) => (
            <li key={item} className="rounded-lg bg-mist px-4 py-3 text-sm leading-7 text-ink">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <article className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-bold tracking-[-0.02em]">Privacy boundary</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Public discovery uses approximate labels and distance buckets. Do not publish your exact location or
            another person's private information.
          </p>
        </article>
        <article className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-bold tracking-[-0.02em]">Payment boundary</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Battarbox does not support deposits, cash settlement, escrow, stored value, credit, or user-to-user
            payment. Report requests for money as part of an exchange.
          </p>
        </article>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/legal/safety" className={secondaryButtonClass}>
          Full safety policy
        </Link>
        <Link href="/legal/prohibited-items" className={secondaryButtonClass}>
          Prohibited items
        </Link>
      </div>
    </main>
  );
}
