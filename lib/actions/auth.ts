"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils";
import { emailSchema, loginSchema, passwordSchema, registerSchema } from "@/lib/validation";

export type FormState = { error?: string; message?: string };

function sanitizeNextPath(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/onboarding` }
  });
  if (error) return { error: error.message };

  return {
    message: "Check your email for a confirmation link to finish creating your account."
  };
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message === "Invalid login credentials" ? "Incorrect email or password" : error.message };
  }

  revalidatePath("/", "layout");
  redirect(sanitizeNextPath(formData.get("next")) as Route);
}

export async function signInWithGitHub(formData: FormData): Promise<void> {
  const next = sanitizeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}` }
  });
  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "GitHub sign-in is not configured")}` as Route);
  }
  // External Stripe/GitHub authorize URL — outside the typed route table.
  redirect(data.url as Route);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/update-password`
  });
  if (error) return { error: error.message };

  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Choose a stronger password" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: error.message };

  redirect("/");
}
