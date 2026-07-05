import type { Metadata } from "next";
import Link from "next/link";
import { InviteForm } from "@/components/invite-form";
import { EmptyState } from "@/components/empty-state";
import { Badge, secondaryButtonClass } from "@/components/ui";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireOnboardedUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Invite friends · Battarbox" };
export const dynamic = "force-dynamic";

type InviteRow = {
  id: string;
  invitee_email: string;
  status: string;
  created_at: string;
  expires_at: string;
};

export default async function InvitePage() {
  const { user } = await requireOnboardedUser("/invite");
  const admin = createSupabaseAdminClient();
  const { data: invites } = await admin
    .from("invites")
    .select("id, invitee_email, status, created_at, expires_at")
    .eq("inviter_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Invite friends</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Invite people you trust to join Battarbox and trade locally or online.
          </p>
        </div>
        <Link href="/" className={secondaryButtonClass}>
          Back to Discover
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <InviteForm />
        <section>
          <h2 className="text-lg font-bold tracking-[-0.02em]">Recent invites</h2>
          {!invites || invites.length === 0 ? (
            <EmptyState title="No invites sent yet." hint="Send your first invite to start growing your trusted network." />
          ) : (
            <ul className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
              {((invites ?? []) as InviteRow[]).map((invite) => (
                <li key={invite.id} className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{invite.invitee_email}</p>
                    <p className="text-xs text-muted">
                      Sent {timeAgo(invite.created_at)} · Expires {timeAgo(invite.expires_at)}
                    </p>
                  </div>
                  <Badge tone={invite.status === "accepted" ? "solid" : "soft"}>{invite.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
