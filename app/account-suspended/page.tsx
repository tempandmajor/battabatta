import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { secondaryButtonClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Account suspended · Battarbox" };

export default async function AccountSuspendedPage() {
  await requireUser("/account-suspended");

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-5 py-10 text-center sm:px-8">
      <ShieldAlert className="mx-auto mb-4" size={28} aria-hidden />
      <h1 className="text-3xl font-bold tracking-[-0.03em]">Account suspended</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Your account is currently restricted from posting, messaging, offers, follows, saves, and reports while
        moderators review platform safety concerns.
      </p>
      <div className="mt-6">
        <Link href="/support" className={secondaryButtonClass}>
          Contact support
        </Link>
      </div>
    </main>
  );
}
