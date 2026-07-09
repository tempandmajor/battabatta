import { NextResponse } from "next/server";

export function GET() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.replace(/^ca-/, "");
  // Serve the authorization line whenever a publisher id is configured, not
  // only when ad serving is enabled: AdSense expects a valid ads.txt during
  // site review, before NEXT_PUBLIC_ADS_ENABLED is turned on. ads.txt only
  // authorizes Google to sell the inventory; it does not itself serve ads.
  if (!publisherId?.startsWith("pub-")) {
    return new NextResponse("", { headers: { "Content-Type": "text/plain" } });
  }

  return new NextResponse(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain" }
  });
}
