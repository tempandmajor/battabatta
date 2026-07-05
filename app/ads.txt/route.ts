import { NextResponse } from "next/server";

export function GET() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.replace(/^ca-/, "");
  if (!publisherId || process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") {
    return new NextResponse("", { headers: { "Content-Type": "text/plain" } });
  }

  return new NextResponse(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain" }
  });
}
