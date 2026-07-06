"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, Mail, MessageCircle, Share2 } from "lucide-react";
import { ghostButtonClass } from "@/components/ui";

/**
 * Share a post to social media and messaging apps. The shared page carries
 * Open Graph tags, so posts with photos render the first photo as the link
 * thumbnail in crawlers that support previews.
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

  const shareText = () => `${title} ${shareUrl()}`;
  const networks = [
    {
      label: "Share on X",
      icon: Share2,
      href: () =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl())}`
    },
    {
      label: "Share on LinkedIn",
      icon: Share2,
      href: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl())}`
    },
    {
      label: "Share on Facebook",
      icon: Share2,
      href: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl())}`
    },
    {
      label: "Send by message",
      icon: MessageCircle,
      href: () => `sms:?&body=${encodeURIComponent(shareText())}`
    },
    {
      label: "Share on WhatsApp",
      icon: MessageCircle,
      href: () => `https://wa.me/?text=${encodeURIComponent(shareText())}`
    },
    {
      label: "Share by email",
      icon: Mail,
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
          {networks.map((network) => {
            const Icon = network.icon;
            return (
              <a
                key={network.label}
                role="menuitem"
                href={network.href()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-mist"
              >
                <Icon size={14} aria-hidden />
                {network.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
