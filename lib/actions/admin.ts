"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth";
import { AD_MODERATION_STATUS } from "@/lib/post-ad-moderation";

type ModerationAction =
  | "report_reviewing"
  | "report_dismissed"
  | "report_actioned"
  | "post_hidden"
  | "post_restored"
  | "post_ads_approved"
  | "post_ads_limited"
  | "post_ads_rejected"
  | "post_ads_suppressed"
  | "profile_suspended"
  | "profile_unsuspended"
  | "profile_blocked"
  | "profile_unblocked";

function textValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

async function writeAudit({
  actorId,
  action,
  reportId,
  targetProfileId,
  targetPostId,
  note
}: {
  actorId: string;
  action: ModerationAction;
  reportId?: string;
  targetProfileId?: string;
  targetPostId?: string;
  note?: string;
}) {
  const { admin } = await requireAdminUser();
  await admin.from("moderation_audit_log").insert({
    actor_id: actorId,
    action,
    report_id: reportId || null,
    target_profile_id: targetProfileId || null,
    target_post_id: targetPostId || null,
    note: note || null
  });
}

export async function setReportReviewing(formData: FormData): Promise<void> {
  const { admin, user } = await requireAdminUser();
  const reportId = textValue(formData, "reportId");
  if (!reportId) return;

  await admin.from("reports").update({ status: "reviewing" }).eq("id", reportId);
  await writeAudit({ actorId: user.id, action: "report_reviewing", reportId });
  revalidatePath("/admin");
}

export async function dismissReport(formData: FormData): Promise<void> {
  const { admin, user } = await requireAdminUser();
  const reportId = textValue(formData, "reportId");
  const note = textValue(formData, "note");
  if (!reportId) return;

  await admin.from("reports").update({ status: "dismissed", reviewed_at: new Date().toISOString() }).eq("id", reportId);
  await writeAudit({ actorId: user.id, action: "report_dismissed", reportId, note });
  revalidatePath("/admin");
}

export async function actionReport(formData: FormData): Promise<void> {
  const { admin, user } = await requireAdminUser();
  const reportId = textValue(formData, "reportId");
  const note = textValue(formData, "note");
  if (!reportId) return;

  await admin.from("reports").update({ status: "actioned", reviewed_at: new Date().toISOString() }).eq("id", reportId);
  await writeAudit({ actorId: user.id, action: "report_actioned", reportId, note });
  revalidatePath("/admin");
}

export async function hidePost(formData: FormData): Promise<void> {
  const { admin, user } = await requireAdminUser();
  const postId = textValue(formData, "postId");
  const reportId = textValue(formData, "reportId");
  const note = textValue(formData, "note");
  if (!postId) return;

  await admin.from("posts").update({ status: "hidden" }).eq("id", postId);
  await writeAudit({ actorId: user.id, action: "post_hidden", reportId, targetPostId: postId, note });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}

export async function restorePost(formData: FormData): Promise<void> {
  const { admin, user } = await requireAdminUser();
  const postId = textValue(formData, "postId");
  const note = textValue(formData, "note");
  if (!postId) return;

  await admin.from("posts").update({ status: "active" }).eq("id", postId);
  await writeAudit({ actorId: user.id, action: "post_restored", targetPostId: postId, note });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}

async function setPostAdModerationStatus(formData: FormData, status: (typeof AD_MODERATION_STATUS)[keyof typeof AD_MODERATION_STATUS], action: ModerationAction): Promise<void> {
  const { admin, user } = await requireAdminUser();
  const postId = textValue(formData, "postId");
  const note = textValue(formData, "note");
  if (!postId) return;

  const now = new Date().toISOString();
  await admin.from("post_ad_moderation").upsert({
    post_id: postId,
    status,
    review_note: note || null,
    reviewed_by: user.id,
    reviewed_at: now,
    ads_enabled: status === AD_MODERATION_STATUS.approved,
    updated_at: now
  });
  await writeAudit({ actorId: user.id, action, targetPostId: postId, note });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}

export async function approvePostAds(formData: FormData): Promise<void> {
  return setPostAdModerationStatus(formData, AD_MODERATION_STATUS.approved, "post_ads_approved");
}

export async function limitPostAds(formData: FormData): Promise<void> {
  return setPostAdModerationStatus(formData, AD_MODERATION_STATUS.limited, "post_ads_limited");
}

export async function rejectPostAds(formData: FormData): Promise<void> {
  return setPostAdModerationStatus(formData, AD_MODERATION_STATUS.rejected, "post_ads_rejected");
}

export async function suspendProfile(formData: FormData): Promise<void> {
  const { admin, user } = await requireAdminUser();
  const profileId = textValue(formData, "profileId");
  const reportId = textValue(formData, "reportId");
  const note = textValue(formData, "note");
  if (!profileId || profileId === user.id) return;

  await admin.from("account_moderation").upsert({
    profile_id: profileId,
    status: "suspended",
    reason: note || null,
    updated_by: user.id,
    updated_at: new Date().toISOString()
  });
  await writeAudit({ actorId: user.id, action: "profile_suspended", reportId, targetProfileId: profileId, note });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function unsuspendProfile(formData: FormData): Promise<void> {
  const { admin, user } = await requireAdminUser();
  const profileId = textValue(formData, "profileId");
  const note = textValue(formData, "note");
  if (!profileId) return;

  await admin.from("account_moderation").upsert({
    profile_id: profileId,
    status: "active",
    reason: note || null,
    updated_by: user.id,
    updated_at: new Date().toISOString()
  });
  await writeAudit({ actorId: user.id, action: "profile_unsuspended", targetProfileId: profileId, note });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function blockProfileFromAdmin(formData: FormData): Promise<void> {
  const { admin, user } = await requireAdminUser();
  const profileId = textValue(formData, "profileId");
  const reportId = textValue(formData, "reportId");
  const note = textValue(formData, "note");
  if (!profileId || profileId === user.id) return;

  await admin.from("account_moderation").upsert({
    profile_id: profileId,
    status: "blocked",
    reason: note || null,
    updated_by: user.id,
    updated_at: new Date().toISOString()
  });
  await writeAudit({ actorId: user.id, action: "profile_blocked", reportId, targetProfileId: profileId, note });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function unblockProfileFromAdmin(formData: FormData): Promise<void> {
  const { admin, user } = await requireAdminUser();
  const profileId = textValue(formData, "profileId");
  const note = textValue(formData, "note");
  if (!profileId) return;

  await admin.from("account_moderation").upsert({
    profile_id: profileId,
    status: "active",
    reason: note || null,
    updated_by: user.id,
    updated_at: new Date().toISOString()
  });
  await writeAudit({ actorId: user.id, action: "profile_unblocked", targetProfileId: profileId, note });
  revalidatePath("/admin");
  revalidatePath("/");
}

const launchStatuses = new Set(["staged", "approved_first_batch", "approved_later_batch", "needs_edits"]);

function launchStatusValue(formData: FormData): "staged" | "approved_first_batch" | "approved_later_batch" | "needs_edits" {
  const status = textValue(formData, "status");
  return launchStatuses.has(status) ? (status as "staged" | "approved_first_batch" | "approved_later_batch" | "needs_edits") : "staged";
}

export async function updateLaunchProfileStatus(formData: FormData): Promise<void> {
  const { admin } = await requireAdminUser();
  const profileId = textValue(formData, "launchProfileId");
  if (!profileId) return;

  await admin
    .from("launch_content_profiles")
    .update({ status: launchStatusValue(formData), notes: textValue(formData, "note") || null })
    .eq("id", profileId);
  revalidatePath("/admin");
}

export async function updateLaunchPostStatus(formData: FormData): Promise<void> {
  const { admin } = await requireAdminUser();
  const postId = textValue(formData, "launchPostId");
  if (!postId) return;

  await admin
    .from("launch_content_posts")
    .update({ status: launchStatusValue(formData), notes: textValue(formData, "note") || null })
    .eq("id", postId);
  revalidatePath("/admin");
}
