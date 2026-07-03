const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact relative time, e.g. "3h ago", "2d ago". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const elapsed = now.getTime() - new Date(iso).getTime();
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Short clock time for today, weekday for this week, date otherwise. */
export function threadTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < DAY && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (elapsed < 2 * DAY) return "Yesterday";
  if (elapsed < 7 * DAY) return date.toLocaleDateString(undefined, { weekday: "short" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export const POST_KIND_LABEL: Record<string, string> = {
  offering: "Offering",
  seeking: "Seeking"
};

export const CATEGORY_LABEL: Record<string, string> = {
  goods: "Goods",
  services: "Services"
};

export const LOCATION_MODE_LABEL: Record<string, string> = {
  local: "Local only",
  online: "Online only",
  local_and_online: "Local & online"
};

export const OFFER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  interested: "Interested",
  countered: "Countered",
  declined: "Declined",
  withdrawn: "Withdrawn",
  blocked: "Unavailable",
  closed_by_user: "Closed"
};
