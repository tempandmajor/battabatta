"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOnboardedUser, requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/upload";
import { LEGAL_DOCUMENT_VERSIONS } from "@/lib/legal";
import { onboardingSchema, profileUpdateSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth";

function pointFrom(latitude?: number, longitude?: number): string | null {
  if (latitude === undefined || longitude === undefined) return null;
  return `POINT(${longitude} ${latitude})`;
}

function friendlyProfileError(message: string): string {
  if (message.includes("profiles_handle_key")) return "That handle is already taken. Try another.";
  if (message.includes("handle")) return "Handles are 3-32 characters: lowercase letters, numbers, underscores.";
  return message;
}

export async function completeOnboarding(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser("/onboarding");

  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    handle: formData.get("handle"),
    bio: formData.get("bio") ?? "",
    publicLocationLabel: formData.get("publicLocationLabel") ?? "",
    locationMode: formData.get("locationMode"),
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    isAdultConfirmed: formData.get("isAdultConfirmed") === "on" ? true : undefined,
    acceptsTerms: formData.get("acceptsTerms") === "on" ? true : undefined
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      handle: parsed.data.handle,
      bio: parsed.data.bio,
      public_location_label: parsed.data.publicLocationLabel || null,
      location_mode: parsed.data.locationMode,
      is_adult_confirmed: true
    })
    .eq("id", user.id);
  if (profileError) return { error: friendlyProfileError(profileError.message) };

  const exactLocation = pointFrom(parsed.data.latitude, parsed.data.longitude);
  if (exactLocation) {
    const { error: locationError } = await supabase
      .from("profile_private")
      .update({ exact_location: exactLocation })
      .eq("profile_id", user.id);
    if (locationError) return { error: locationError.message };
  }

  const { error: consentError } = await supabase.from("legal_consents").insert(
    (Object.entries(LEGAL_DOCUMENT_VERSIONS) as Array<[string, string]>).map(([key, version]) => ({
      profile_id: user.id,
      document_key: key,
      document_version: version,
      user_agent: null
    }))
  );
  if (consentError) return { error: consentError.message };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireOnboardedUser("/settings");

  const parsed = profileUpdateSchema.safeParse({
    displayName: formData.get("displayName"),
    handle: formData.get("handle"),
    bio: formData.get("bio") ?? "",
    publicLocationLabel: formData.get("publicLocationLabel") ?? "",
    locationMode: formData.get("locationMode"),
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    isPaused: formData.get("isPaused") === "on",
    interests: formData
      .getAll("interests")
      .flatMap((value) => String(value).split(","))
      .map((value) => value.trim())
      .filter(Boolean)
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }

  let avatarPath: string | null = null;
  try {
    avatarPath = await uploadImage(supabase, "avatars", user.id, formData.get("avatar"));
  } catch (uploadError) {
    return { error: uploadError instanceof Error ? uploadError.message : "Photo upload failed" };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      handle: parsed.data.handle,
      bio: parsed.data.bio,
      public_location_label: parsed.data.publicLocationLabel || null,
      location_mode: parsed.data.locationMode,
      is_paused: parsed.data.isPaused,
      ...(avatarPath ? { avatar_url: avatarPath } : {})
    })
    .eq("id", user.id);
  if (profileError) return { error: friendlyProfileError(profileError.message) };

  const exactLocation = pointFrom(parsed.data.latitude, parsed.data.longitude);
  if (exactLocation) {
    const { error: locationError } = await supabase
      .from("profile_private")
      .update({ exact_location: exactLocation })
      .eq("profile_id", user.id);
    if (locationError) return { error: locationError.message };
  }

  const { error: deleteError } = await supabase.from("profile_interests").delete().eq("profile_id", user.id);
  if (deleteError) return { error: deleteError.message };
  if (parsed.data.interests.length > 0) {
    const unique = Array.from(new Set(parsed.data.interests));
    const { error: interestsError } = await supabase
      .from("profile_interests")
      .insert(unique.map((label) => ({ profile_id: user.id, label })));
    if (interestsError) return { error: interestsError.message };
  }

  revalidatePath("/", "layout");
  return { message: "Profile updated." };
}

export async function deleteAccount(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser("/settings");

  if (formData.get("confirm") !== "delete my account") {
    redirect("/settings?error=type-confirmation");
  }

  // Requires the service role: auth.users deletion cascades to profiles and
  // all owned rows via foreign keys.
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/");
}
