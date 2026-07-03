import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();
const supabaseWsOrigin = supabaseOrigin.replace(/^http/, "ws");

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for its bootstrap scripts and 'unsafe-eval' in dev (react-refresh).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`.trim(),
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWsOrigin}`.trim(),
  "frame-src https://checkout.stripe.com https://js.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com https://github.com"
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" }
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Post photo uploads go through server actions (3 x 5 MB max).
      bodySizeLimit: "16mb"
    }
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
