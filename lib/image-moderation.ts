/**
 * Automated image moderation for ad-safety.
 *
 * Listings with photos still require mandatory manual review before they are
 * monetized (their `post_ad_moderation` row stays `pending_review`), so this
 * scan is an ASSIST to human reviewers, never an auto-approve gate. It fails
 * safe: when the provider is not configured or a request errors, we surface an
 * explicit flag (`image_scan_unavailable` / `image_scan_error`) so the reviewer
 * knows the images were not machine-checked rather than silently passing them.
 *
 * Provider: Sightengine (https://sightengine.com). Its per-model probabilities
 * map directly onto the Google Publisher Restriction categories we care about
 * (nudity, weapons, alcohol, drugs, gambling, offensive/gore). Configure with
 * SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET; without them the scan is
 * inert (local dev, previews) and simply asks for manual review.
 */

// Probability threshold above which a category is treated as flagged.
const FLAG_THRESHOLD = 0.5;
// Sightengine models to request. Each maps to one or more probabilities below.
const MODELS = "nudity-2.1,weapon,alcohol,recreational_drug,medical,gambling,offensive-2.0,gore-2.0";

export type ImageModerationResult = {
  /** Ad-safety flags, e.g. ["image_weapons", "image_adult"]. Empty means clean. */
  flags: string[];
  /** True only when every image was successfully machine-scanned. */
  scanned: boolean;
};

function isConfigured(): boolean {
  return Boolean(process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET);
}

type SightengineResponse = {
  status: string;
  error?: { message?: string };
  nudity?: { sexual_activity?: number; sexual_display?: number; erotica?: number; very_suggestive?: number };
  weapon?: { classes?: { firearm?: number; knife?: number } } | number;
  alcohol?: number;
  recreational_drug?: number;
  medical?: number;
  gambling?: number;
  offensive?: { prob?: number };
  gore?: { prob?: number };
};

function num(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function flagsForImage(data: SightengineResponse): string[] {
  const flags: string[] = [];
  const nudity = data.nudity ?? {};
  const adult = Math.max(
    num(nudity.sexual_activity),
    num(nudity.sexual_display),
    num(nudity.erotica),
    num(nudity.very_suggestive)
  );
  if (adult >= FLAG_THRESHOLD) flags.push("image_adult");

  const weapon =
    typeof data.weapon === "number"
      ? data.weapon
      : Math.max(num(data.weapon?.classes?.firearm), num(data.weapon?.classes?.knife));
  if (weapon >= FLAG_THRESHOLD) flags.push("image_weapons");

  if (num(data.alcohol) >= FLAG_THRESHOLD) flags.push("image_alcohol");
  if (num(data.recreational_drug) >= FLAG_THRESHOLD) flags.push("image_drugs");
  if (num(data.medical) >= FLAG_THRESHOLD) flags.push("image_prescription");
  if (num(data.gambling) >= FLAG_THRESHOLD) flags.push("image_gambling");
  if (num(data.offensive?.prob) >= FLAG_THRESHOLD) flags.push("image_offensive");
  if (num(data.gore?.prob) >= FLAG_THRESHOLD) flags.push("image_gore");
  return flags;
}

async function scanOne(url: string): Promise<{ flags: string[]; ok: boolean }> {
  const params = new URLSearchParams({
    url,
    models: MODELS,
    api_user: process.env.SIGHTENGINE_API_USER as string,
    api_secret: process.env.SIGHTENGINE_API_SECRET as string
  });
  try {
    const response = await fetch(`https://api.sightengine.com/1.0/check.json?${params.toString()}`, {
      // Never cache moderation results, and cap the wait so a slow provider
      // cannot hang post creation.
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) return { flags: [], ok: false };
    const data = (await response.json()) as SightengineResponse;
    if (data.status !== "success") return { flags: [], ok: false };
    return { flags: flagsForImage(data), ok: true };
  } catch {
    return { flags: [], ok: false };
  }
}

/**
 * Scans public image URLs for restricted content. Safe to call with any input:
 * returns clean when there are no images, an "unavailable" flag when the
 * provider is unconfigured, and an "error" flag when any request fails.
 */
export async function moderateImages(urls: string[]): Promise<ImageModerationResult> {
  if (urls.length === 0) return { flags: [], scanned: true };
  if (!isConfigured()) return { flags: ["image_scan_unavailable"], scanned: false };

  const results = await Promise.all(urls.map(scanOne));
  const flags = new Set<string>();
  let scanned = true;
  for (const result of results) {
    if (!result.ok) {
      scanned = false;
      continue;
    }
    for (const flag of result.flags) flags.add(flag);
  }
  if (!scanned) flags.add("image_scan_error");
  return { flags: [...flags], scanned };
}
