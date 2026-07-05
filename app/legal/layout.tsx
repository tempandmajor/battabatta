import Link from "next/link";
import { nonprofit } from "@/lib/nonprofit";

const legalNav = [
  { href: "/legal/terms", label: "Terms of Use" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/safety", label: "Safety" },
  { href: "/legal/prohibited-items", label: "Prohibited Items" },
  { href: "/legal/dmca", label: "Copyright & DMCA" },
  { href: "/legal/tax-notice", label: "Tax Notice" }
] as const;

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <p
        role="note"
        className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] font-medium leading-6 text-amber-900"
      >
        {nonprofit.policyReviewedText}
      </p>
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Legal documents" className="flex flex-row flex-wrap gap-1 lg:flex-col">
          {legalNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted hover:bg-mist hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <article className="legal-prose max-w-3xl">{children}</article>
      </div>
    </main>
  );
}
