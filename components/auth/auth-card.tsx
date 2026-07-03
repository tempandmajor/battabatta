import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-white p-8">
          <Link href="/" className="mb-6 inline-flex h-10 items-center" aria-label="Battarbox home">
            <Image
              src="/battarbox-logo.png"
              alt="Battarbox"
              width={150}
              height={50}
              priority
              className="h-9 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-[-0.03em]">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
