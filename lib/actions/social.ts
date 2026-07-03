"use server";

import { revalidatePath } from "next/cache";
import { requireOnboardedUser } from "@/lib/auth";
import { reportSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth";

export async function toggleFollow(formData: FormData): Promise<void> {
  const { supabase, user } = await requireOnboardedUser();
  const followeeId = String(formData.get("followeeId") ?? "");
  const currentlyFollowing = formData.get("following") === "true";
  const handle = String(formData.get("handle") ?? "");

  if (currentlyFollowing) {
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", followeeId);
  } else {
    await supabase.from("follows").upsert({ follower_id: user.id, followee_id: followeeId });
  }
  if (handle) revalidatePath(`/profiles/${handle}`);
}

export async function blockProfile(formData: FormData): Promise<void> {
  const { supabase, user } = await requireOnboardedUser();
  const blockedId = String(formData.get("blockedId") ?? "");
  if (!blockedId || blockedId === user.id) return;

  await supabase.from("blocks").upsert({
    blocker_id: user.id,
    blocked_id: blockedId,
    reason: null
  });
  revalidatePath("/", "layout");
}

export async function unblockProfile(formData: FormData): Promise<void> {
  const { supabase, user } = await requireOnboardedUser();
  const blockedId = String(formData.get("blockedId") ?? "");

  await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", blockedId);
  revalidatePath("/", "layout");
}

export async function submitReport(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireOnboardedUser();

  const parsed = reportSchema.safeParse({
    reason: formData.get("reason"),
    reportedProfileId: formData.get("reportedProfileId") || undefined,
    postId: formData.get("postId") || undefined,
    offerId: formData.get("offerId") || undefined,
    messageId: formData.get("messageId") || undefined
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Tell us what happened" };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_profile_id: parsed.data.reportedProfileId ?? null,
    post_id: parsed.data.postId ?? null,
    offer_id: parsed.data.offerId ?? null,
    message_id: parsed.data.messageId ?? null,
    reason: parsed.data.reason
  });
  if (error) return { error: error.message };

  return { message: "Report received. Our moderators will review it. Thank you for keeping BattaBatta safe." };
}
