import type { ReactNode } from "react";

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-sm text-[13px] leading-6 text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
