"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

function adConfig() {
  return {
    enabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
    cmpReady: process.env.NEXT_PUBLIC_ADSENSE_CMP_READY === "true",
    serveEeaUkCh: process.env.NEXT_PUBLIC_SERVE_EEA_UK_CH === "true",
    clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
    slotId: process.env.NEXT_PUBLIC_ADSENSE_IN_FEED_SLOT_ID
  };
}

export function inFeedAdsEnabled() {
  const { enabled, cmpReady, serveEeaUkCh, clientId, slotId } = adConfig();
  if (!enabled || !clientId || !slotId) return false;
  if (serveEeaUkCh && !cmpReady) return false;
  return true;
}

export function InFeedAdCard() {
  const { clientId, slotId } = adConfig();

  useEffect(() => {
    if (!inFeedAdsEnabled()) return;
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      // Ad blockers or network failures should not affect discovery.
    }
  }, [clientId, slotId]);

  if (!inFeedAdsEnabled()) return null;

  return (
    <article className="flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-line bg-white p-5">
      <Script
        id="adsense-script"
        async
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
        crossOrigin="anonymous"
      />
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
          {/* Google allows only "Advertisements" or "Sponsored Links" as ad labels. */}
          Advertisements
        </span>
      </div>
      <ins
        className="adsbygoogle block min-h-48 w-full"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
      />
    </article>
  );
}
