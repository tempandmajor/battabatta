import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-ink";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-ink px-6 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-85 disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-ink bg-white px-6 py-2.5 text-[13px] font-semibold text-ink transition hover:bg-mist disabled:opacity-50";

export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-medium text-muted transition hover:border-ink hover:text-ink";

export function Field({
  label,
  htmlFor,
  hint,
  children
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}

export function FormAlert({ error, message }: { error?: string; message?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-800">
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p role="status" className="rounded-lg bg-mist px-3.5 py-2.5 text-[13px] font-medium text-ink">
        {message}
      </p>
    );
  }
  return null;
}

export function Badge({ children, tone = "outline" }: { children: ReactNode; tone?: "solid" | "outline" | "soft" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]",
        tone === "solid" && "border border-ink bg-ink text-white",
        tone === "outline" && "border border-ink bg-white text-ink",
        tone === "soft" && "bg-mist font-medium normal-case tracking-normal text-muted"
      )}
    >
      {children}
    </span>
  );
}
