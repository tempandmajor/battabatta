import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const staticPaths = [
    "",
    "/about",
    "/how-it-works",
    "/guides/good-posts",
    "/guides/safety-checklist",
    "/guides/community-examples",
    "/support",
    "/login",
    "/register",
    "/legal/terms",
    "/legal/privacy",
    "/legal/safety",
    "/legal/prohibited-items",
    "/legal/dmca",
    "/legal/tax-notice"
  ];
  return staticPaths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "hourly" : "monthly",
    priority: path === "" ? 1 : 0.5
  }));
}
