import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/format";
import { publicStorageUrl } from "@/lib/utils";

export function Avatar({
  name,
  avatarPath,
  tone = "light",
  size = "md",
  className
}: {
  name: string;
  /** Storage path in the public "avatars" bucket, from profiles.avatar_url. */
  avatarPath?: string | null;
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = cn(
    size === "sm" && "size-7 text-[11px]",
    size === "md" && "size-9 text-[13px]",
    size === "lg" && "size-24 text-3xl tracking-[-0.02em]"
  );

  if (avatarPath) {
    return (
      <img
        src={publicStorageUrl("avatars", avatarPath)}
        alt=""
        className={cn("shrink-0 rounded-full border border-line object-cover", sizeClasses, className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-line font-semibold",
        tone === "dark" ? "bg-ink text-white" : "bg-[#f0f0f0] text-ink",
        sizeClasses,
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/** Deterministic light/dark tone so a given member always gets the same avatar. */
export function avatarTone(id: string): "dark" | "light" {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return hash % 2 === 0 ? "dark" : "light";
}
