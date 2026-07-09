import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const AD_MODERATION_STATUS = {
  pending: "pending_review",
  approved: "approved",
  limited: "limited_ads",
  rejected: "rejected",
  reported: "reported"
} as const;

export type AdModerationStatus = (typeof AD_MODERATION_STATUS)[keyof typeof AD_MODERATION_STATUS];

export async function upsertPostAdModeration({
  postId,
  status,
  automatedFlags,
  note,
  reviewedBy
}: {
  postId: string;
  status: AdModerationStatus;
  automatedFlags?: string[];
  note?: string | null;
  reviewedBy?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  await admin.from("post_ad_moderation").upsert({
    post_id: postId,
    status,
    automated_flags: automatedFlags ?? [],
    review_note: note ?? null,
    reviewed_by: reviewedBy ?? null,
    reviewed_at: reviewedBy ? now : null,
    ads_enabled: status === AD_MODERATION_STATUS.approved,
    last_scanned_at: now,
    updated_at: now
  });
}

export async function getPostAdModerationMap(postIds: string[]): Promise<Map<string, AdModerationStatus>> {
  if (postIds.length === 0) return new Map();
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("post_ad_moderation").select("post_id, status").in("post_id", postIds);
  return new Map(((data ?? []) as Array<{ post_id: string; status: AdModerationStatus }>).map((row) => [row.post_id, row.status]));
}
