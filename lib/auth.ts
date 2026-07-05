import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Redirects to /login when signed out. */
export async function requireUser(redirectTo?: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    redirect(redirectTo ? `/login?next=${encodeURIComponent(redirectTo)}` : "/login");
  }
  return { supabase, user };
}

export async function isProfileSuspended(profileId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("account_moderation")
    .select("status")
    .eq("profile_id", profileId)
    .in("status", ["suspended", "blocked"])
    .maybeSingle();
  return Boolean(data);
}

export async function isAdminProfile(profileId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("admin_roles").select("role").eq("profile_id", profileId).maybeSingle();
  return Boolean(data);
}

export async function requireAdminUser() {
  const { supabase, user } = await requireUser("/admin");
  const admin = createSupabaseAdminClient();
  const { data: role } = await admin.from("admin_roles").select("role").eq("profile_id", user.id).maybeSingle();

  if (!role) {
    redirect("/");
  }

  return { supabase, admin, user, role: role.role as "admin" | "moderator" };
}

/**
 * Redirects to /login when signed out and to /onboarding until the member has
 * confirmed they are 18+ and accepted the terms (is_adult_confirmed).
 */
export async function requireOnboardedUser(redirectTo?: string) {
  const { supabase, user } = await requireUser(redirectTo);
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_adult_confirmed) {
    redirect("/onboarding");
  }
  if (await isProfileSuspended(user.id)) {
    redirect("/account-suspended");
  }
  return { supabase, user, profile };
}
