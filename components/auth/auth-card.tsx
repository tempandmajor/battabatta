import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-white p-8">
          <Link href="/" className="mb-6 inline-flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-[7px] bg-ink text-[13px] font-bold text-white">
              BB
            </span>
            <span className="text-base font-bold tracking-[-0.02em]">BattaBatta</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-[-0.03em]">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
