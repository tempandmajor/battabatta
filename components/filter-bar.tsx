"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryFilters = [
  { value: "", label: "All" },
  { value: "goods", label: "Goods" },
  { value: "services", label: "Services" }
] as const;

const kindFilters = [
  { value: "", label: "Any kind" },
  { value: "offering", label: "Offering" },
  { value: "seeking", label: "Seeking" }
] as const;

export function FilterBar({
  scope,
  category,
  kind,
  distance
}: {
  scope: "local" | "online";
  category: string;
  kind: string;
  distance: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mt-7 flex flex-wrap items-center gap-2">
      {categoryFilters.map((item) => (
        <button
          key={item.label}
          onClick={() => setParam("category", item.value)}
          aria-pressed={category === item.value}
          className={cn(
            "rounded-full border px-4 py-2 text-[13px] font-medium transition hover:border-ink",
            category === item.value ? "border-ink bg-ink text-white" : "border-line bg-white text-[#3d3d3d]"
          )}
        >
          {item.label}
        </button>
      ))}
      <span aria-hidden className="mx-1 h-5 w-px bg-line" />
      {kindFilters.map((item) => (
        <button
          key={item.label}
          onClick={() => setParam("kind", item.value)}
          aria-pressed={kind === item.value}
          className={cn(
            "rounded-full border px-4 py-2 text-[13px] font-medium transition hover:border-ink",
            kind === item.value ? "border-ink bg-ink text-white" : "border-line bg-white text-[#3d3d3d]"
          )}
        >
          {item.label}
        </button>
      ))}
      {scope === "local" && (
        <div className="ml-auto flex items-center gap-2 text-[13px] text-muted">
          <SlidersHorizontal size={15} aria-hidden />
          <label htmlFor="distance">Distance</label>
          <select
            id="distance"
            value={distance}
            onChange={(event) => setParam("distance", event.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 font-medium text-ink"
          >
            {[2, 5, 10, 25].map((miles) => (
              <option key={miles} value={miles}>
                {miles} mi
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export function ScopeToggle({ scope }: { scope: "local" | "online" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setScope(value: "local" | "online") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", value);
    router.replace(`/?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex rounded-[10px] bg-mist p-1" role="tablist" aria-label="Discovery scope">
      {(["local", "online"] as const).map((value) => (
        <button
          key={value}
          role="tab"
          aria-selected={scope === value}
          onClick={() => setScope(value)}
          className={cn(
            "rounded-lg px-5 py-2 text-[13px] font-semibold capitalize text-[#8a8a8a]",
            scope === value && "bg-white text-ink shadow-[0_1px_4px_rgba(10,10,10,0.10)]"
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
