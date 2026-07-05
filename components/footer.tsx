import Link from "next/link";
import { nonprofit } from "@/lib/nonprofit";

const legalLinks = [
  { href: "/legal/terms", label: "Terms of Use" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/safety", label: "Safety" },
  { href: "/legal/prohibited-items", label: "Prohibited Items" },
  { href: "/legal/dmca", label: "Copyright" },
  { href: "/legal/tax-notice", label: "Tax Notice" }
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8">
        <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-[13px] font-medium text-muted hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 text-xs leading-5 text-muted">
          <p>{nonprofit.businessDescription}</p>
          <p>
            © {new Date().getFullYear()} {nonprofit.publicName} ·{" "}
            <a href={`mailto:${nonprofit.supportEmail}`} className="font-medium text-ink hover:underline">
              {nonprofit.supportEmail}
            </a>{" "}
            ·{" "}
            <Link href="/support" className="font-medium text-ink hover:underline">
              Support OMS2
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
