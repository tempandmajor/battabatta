import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "BattaBatta — barter discovery",
    template: "%s"
  },
  description:
    "Free-first barter discovery for local and online exchanges. Publish what you can offer, find what you need, and negotiate non-binding trades.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "BattaBatta — barter discovery",
    description:
      "Free-first barter discovery for local and online exchanges. Nonprofit-owned, no user-to-user payments.",
    url: siteUrl,
    siteName: "BattaBatta",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-paper text-ink">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
