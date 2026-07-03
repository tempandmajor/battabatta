"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar, avatarTone } from "@/components/avatar";
import { signOut } from "@/lib/actions/auth";

export function UserMenu({
  displayName,
  handle,
  userId,
  avatarPath
}: {
  displayName: string;
  handle: string | null;
  userId: string;
  avatarPath?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="rounded-full transition hover:opacity-80"
      >
        <Avatar name={displayName} avatarPath={avatarPath} tone={avatarTone(userId)} size="md" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl border border-line bg-white py-1.5 shadow-lift"
        >
          <p className="border-b border-line px-4 py-2.5">
            <span className="block truncate text-[13px] font-semibold text-ink">{displayName}</span>
            {handle && <span className="block truncate text-xs text-muted">@{handle}</span>}
          </p>
          {handle && (
            <Link
              role="menuitem"
              href={`/profiles/${handle}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-mist"
            >
              View profile
            </Link>
          )}
          <Link
            role="menuitem"
            href="/posts/mine"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-mist"
          >
            My posts
          </Link>
          <Link
            role="menuitem"
            href="/saved"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-mist"
          >
            Saved
          </Link>
          <Link
            role="menuitem"
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-mist"
          >
            Settings
          </Link>
          <form action={signOut}>
            <button
              role="menuitem"
              type="submit"
              className="block w-full px-4 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-mist"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
