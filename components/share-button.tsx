"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { ghostButtonClass } from "@/components/ui";

/**
 * Share a post to social media. Uses the native share sheet where available
 * (mobile); otherwise opens a small menu with copy-link and per-network links.
 * The shared page carries OpenGraph tags, so posts with photos render the
 * first photo as the link thumbnail.
 */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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

  function shareUrl() {
    return new URL(path, window.location.origin).toString();
  }

  async function share() {
    const url = shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed the sheet, or sharing failed — fall through to menu.
      }
    }
    setOpen((value) => !value);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    } catch {
      setCopied(false);
    }
  }

  const networks = [
    {
      label: "Share on X",
      href: () =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl())}`
    },
    {
      label: "Share on Facebook",
      href: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl())}`
    },
    {
      label: "Share on WhatsApp",
      href: () => `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl()}`)}`
    },
    {
      label: "Share by email",
      href: () => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl())}`
    }
  ];

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={share} aria-expanded={open} aria-haspopup="menu" className={ghostButtonClass}>
        <Share2 size={14} className="mr-1.5" aria-hidden />
        Share
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border border-line bg-white py-1.5 shadow-lift"
        >
          <button
            role="menuitem"
            type="button"
            onClick={copyLink}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-mist"
          >
            {copied ? <Check size={14} aria-hidden /> : <Link2 size={14} aria-hidden />}
            {copied ? "Link copied" : "Copy link"}
          </button>
          {networks.map((network) => (
            <a
              key={network.label}
              role="menuitem"
              href={network.href()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-mist"
            >
              {network.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
