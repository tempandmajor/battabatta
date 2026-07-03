import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { OnboardingForm } from "@/components/onboarding-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Set up your profile · BattaBatta" };

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser("/onboarding");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.is_adult_confirmed) redirect("/");

  const emailPrefix = (user.email ?? "").split("@")[0] ?? "";
  const suggestedHandle = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 32);

  return (
    <AuthCard
      title="Set up your profile"
      subtitle="Tell neighbors what you trade. BattaBatta is for adults and every offer is a non-binding conversation."
    >
      <OnboardingForm
        defaultDisplayName={profile?.display_name ?? emailPrefix}
        defaultHandle={profile?.handle ?? suggestedHandle}
      />
    </AuthCard>
  );
}
