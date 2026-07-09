import type { Metadata } from "next";
import Script from "next/script";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getSiteUrl } from "@/lib/utils";
import "./globals.css";

const siteUrl = getSiteUrl();
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  title: {
    default: "Battarbox — barter discovery",
    template: "%s"
  },
  description:
    "Free-first barter discovery for local and online exchanges. Publish what you can offer, find what you need, and negotiate non-binding trades.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Battarbox — barter discovery",
    description:
      "Free-first barter discovery for local and online exchanges. Nonprofit-owned, no user-to-user payments.",
    url: siteUrl,
    siteName: "Battarbox",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-paper text-ink">
        {adsenseClientId && adsenseClientId.startsWith("ca-pub-") ? (
          // Site-wide AdSense loader so Google can verify the site during
          // review and serve Auto ads. Shares the id used by InFeedAdCard, so
          // next/script loads adsbygoogle.js only once. Presence is gated on the
          // client id alone (not NEXT_PUBLIC_ADS_ENABLED) so the code is
          // discoverable before ad slots are switched on.
          <Script
            id="adsense-script"
            async
            strategy="beforeInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        ) : null}
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
