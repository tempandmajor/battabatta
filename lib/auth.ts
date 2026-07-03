import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  return { supabase, user, profile };
}
