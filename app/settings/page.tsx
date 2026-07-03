import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
import { BillingSection } from "@/components/billing-section";
import { DangerZone } from "@/components/danger-zone";
import { unblockProfile } from "@/lib/actions/social";
import { requireOnboardedUser } from "@/lib/auth";
import { ghostButtonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Settings · Battarbox" };

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await requireOnboardedUser("/settings");

  const [{ data: interests }, { data: privateProfile }, { data: blocks }] = await Promise.all([
    supabase.from("profile_interests").select("label").eq("profile_id", user.id).order("label"),
    supabase
      .from("profile_private")
      .select("subscription_status, stripe_customer_id")
      .eq("profile_id", user.id)
      .single(),
    supabase
      .from("blocks")
      .select("blocked_id, profiles:blocked_id (display_name, handle)")
      .eq("blocker_id", user.id)
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
      <h1 className="text-3xl font-bold tracking-[-0.03em]">Settings</h1>
      {params.error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-800">
          {params.error === "type-confirmation"
            ? "To delete your account, type the confirmation phrase exactly."
            : params.error}
        </p>
      )}

      <section className="mt-8">
        <SettingsForm profile={profile} interests={(interests ?? []).map((row) => row.label)} />
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">Blocked members</h2>
        {!blocks || blocks.length === 0 ? (
          <p className="text-[13px] text-muted">You have not blocked anyone.</p>
        ) : (
          <ul className="space-y-2">
            {blocks.map((block) => {
              const blocked = block.profiles as unknown as { display_name: string; handle: string | null } | null;
              return (
                <li
                  key={block.blocked_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
                >
                  <span className="text-[13px] font-medium">
                    {blocked?.display_name ?? "Member"}
                    {blocked?.handle && <span className="text-muted"> · @{blocked.handle}</span>}
                  </span>
                  <form action={unblockProfile}>
                    <input type="hidden" name="blockedId" value={block.blocked_id} />
                    <button type="submit" className={ghostButtonClass}>
                      Unblock
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <BillingSection
        subscriptionStatus={privateProfile?.subscription_status ?? "none"}
        hasStripeCustomer={Boolean(privateProfile?.stripe_customer_id)}
      />

      <DangerZone />
    </main>
  );
}
