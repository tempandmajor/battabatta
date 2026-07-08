"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOnboardedUser } from "@/lib/auth";
import { validatePublicContentForAdsense } from "@/lib/content-moderation";
import { uploadImage } from "@/lib/upload";
import { postSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth";

const MAX_POST_PHOTOS = 3;

async function uploadPostPhotos(
  supabase: Awaited<ReturnType<typeof requireOnboardedUser>>["supabase"],
  userId: string,
  postId: string,
  formData: FormData,
  startPosition: number
): Promise<string | null> {
  const files = formData.getAll("photos").slice(0, MAX_POST_PHOTOS);
  let position = startPosition;
  for (const file of files) {
    try {
      const path = await uploadImage(supabase, "post-photos", userId, file);
      if (!path) continue;
      const { error } = await supabase.from("post_photos").insert({ post_id: postId, path, position });
      if (error) return error.message;
      position += 1;
    } catch (uploadError) {
      return uploadError instanceof Error ? uploadError.message : "Photo upload failed";
    }
  }
  return null;
}

function parsePostForm(formData: FormData) {
  return postSchema.safeParse({
    kind: formData.get("kind"),
    category: formData.get("category"),
    title: formData.get("title"),
    body: formData.get("body"),
    whatICanGive: formData.get("whatICanGive") ?? "",
    locationMode: formData.get("locationMode"),
    approvalPolicy: formData.get("approvalPolicy") ?? "manual_approval",
    availabilityTotal: formData.get("availabilityTotal") || undefined,
    availabilityUnit: formData.get("availabilityUnit") || undefined
  });
}

export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user, profile } = await requireOnboardedUser("/posts/new");

  const parsed = parsePostForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }
  const moderationError = validatePublicContentForAdsense([
    parsed.data.title,
    parsed.data.body,
    parsed.data.whatICanGive,
    parsed.data.availabilityUnit
  ]);
  if (moderationError) return { error: moderationError };

  // Local posts inherit the member's private coordinates (for bucketed distance
  // in discovery) and public label. Never any address or exact display.
  let location: string | null = null;
  if (parsed.data.locationMode !== "online") {
    const { data: privateProfile } = await supabase
      .from("profile_private")
      .select("exact_location")
      .eq("profile_id", user.id)
      .single();
    location = (privateProfile?.exact_location as string | null) ?? null;
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      owner_id: user.id,
      kind: parsed.data.kind,
      category: parsed.data.category,
      title: parsed.data.title,
      body: parsed.data.body,
      what_i_can_give: parsed.data.whatICanGive || null,
      location_mode: parsed.data.locationMode,
      approximate_location_label:
        parsed.data.locationMode === "online" ? "Online" : profile.public_location_label,
      location,
      approval_policy: parsed.data.approvalPolicy,
      availability_total: parsed.data.availabilityTotal ?? null,
      availability_remaining: parsed.data.availabilityTotal ?? null,
      availability_unit: parsed.data.availabilityUnit ?? null,
      status: "active"
    })
    .select("id")
    .single();
  if (error || !post) return { error: error?.message ?? "Could not create the post" };

  const photoError = await uploadPostPhotos(supabase, user.id, post.id, formData, 0);
  if (photoError) return { error: `Post created, but a photo failed: ${photoError}` };

  revalidatePath("/");
  redirect(`/posts/${post.id}`);
}

export async function updatePost(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireOnboardedUser();
  const postId = String(formData.get("postId") ?? "");

  const parsed = parsePostForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }
  const moderationError = validatePublicContentForAdsense([
    parsed.data.title,
    parsed.data.body,
    parsed.data.whatICanGive,
    parsed.data.availabilityUnit
  ]);
  if (moderationError) return { error: moderationError };

  const status = formData.get("status") === "paused" ? "paused" : "active";

  // RLS restricts this update to the owner.
  const { data: updated, error } = await supabase
    .from("posts")
    .update({
      kind: parsed.data.kind,
      category: parsed.data.category,
      title: parsed.data.title,
      body: parsed.data.body,
      what_i_can_give: parsed.data.whatICanGive || null,
      location_mode: parsed.data.locationMode,
      approval_policy: parsed.data.approvalPolicy,
      availability_total: parsed.data.availabilityTotal ?? null,
      availability_unit: parsed.data.availabilityUnit ?? null,
      status
    })
    .eq("id", postId)
    .select("id")
    .single();
  if (error || !updated) return { error: error?.message ?? "Could not update the post" };

  const removePhotoIds = formData.getAll("removePhotoIds").map(String).filter(Boolean);
  if (removePhotoIds.length > 0) {
    await supabase.from("post_photos").delete().eq("post_id", postId).in("id", removePhotoIds);
  }

  const { count: existingCount } = await supabase
    .from("post_photos")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  const photoError = await uploadPostPhotos(supabase, user.id, postId, formData, existingCount ?? 0);
  if (photoError) return { error: `Post saved, but a photo failed: ${photoError}` };

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  return { message: "Post updated." };
}

export async function deletePost(formData: FormData): Promise<void> {
  const { supabase } = await requireOnboardedUser();
  const postId = String(formData.get("postId") ?? "");

  await supabase.from("posts").update({ status: "deleted" }).eq("id", postId);
  revalidatePath("/");
  redirect("/posts/mine");
}

export async function toggleSavePost(formData: FormData): Promise<void> {
  const { supabase, user } = await requireOnboardedUser();
  const postId = String(formData.get("postId") ?? "");
  const currentlySaved = formData.get("saved") === "true";

  if (currentlySaved) {
    await supabase.from("saved_posts").delete().eq("profile_id", user.id).eq("post_id", postId);
  } else {
    await supabase.from("saved_posts").upsert({ profile_id: user.id, post_id: postId });
  }
  revalidatePath("/");
  revalidatePath("/saved");
  if (postId) revalidatePath(`/posts/${postId}`);
}
