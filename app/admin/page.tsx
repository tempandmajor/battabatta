import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Badge, ghostButtonClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import {
  actionReport,
  blockProfileFromAdmin,
  dismissReport,
  hidePost,
  restorePost,
  setReportReviewing,
  suspendProfile,
  unblockProfileFromAdmin,
  unsuspendProfile
} from "@/lib/actions/admin";
import { requireAdminUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Battarbox" };

type ReportRow = {
  id: string;
  reporter_id: string | null;
  reported_profile_id: string | null;
  post_id: string | null;
  offer_id: string | null;
  message_id: string | null;
  reason: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string;
  handle: string | null;
  created_at: string;
};

type PostRow = {
  id: string;
  owner_id: string;
  title: string;
  status: string;
};

type MessageRow = {
  id: string;
  body: string;
  sender_id: string;
};

type OfferRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  offered_item: string;
  requested_item: string;
  status: string;
};

type ModerationRow = {
  profile_id: string;
  status: string;
  reason: string | null;
  updated_at: string;
};

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  report_id: string | null;
  target_profile_id: string | null;
  target_post_id: string | null;
  note: string | null;
  created_at: string;
};

type DonationRow = {
  id: string;
  profile_id: string | null;
  amount_cents: number;
  currency: string;
  donor_email: string | null;
  donor_name: string | null;
  receipt_sent_at: string | null;
  receipt_error: string | null;
  created_at: string;
};

type PrivateProfileRow = {
  profile_id: string;
  email: string | null;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean;
  subscription_last_payment_status: string | null;
};

function keyById<T extends { id: string }>(rows: T[] | null | undefined): Map<string, T> {
  return new Map((rows ?? []).map((row) => [row.id, row]));
}

function profileLabel(profile: ProfileRow | undefined | null): string {
  if (!profile) return "Unknown member";
  return profile.handle ? `${profile.display_name} (@${profile.handle})` : profile.display_name;
}

function reportTone(status: string): "solid" | "outline" | "soft" {
  if (status === "open") return "solid";
  if (status === "reviewing") return "outline";
  return "soft";
}

function money(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(amountCents / 100);
}

function NoteField({ id }: { id: string }) {
  return (
    <textarea
      id={id}
      name="note"
      rows={2}
      maxLength={1000}
      placeholder="Internal note"
      className={`${inputClass} min-h-20 text-[13px]`}
    />
  );
}

export default async function AdminPage() {
  const { admin, user, role } = await requireAdminUser();

  const [
    { data: reports },
    { data: profiles },
    { data: posts },
    { data: messages },
    { data: offers },
    { data: moderation },
    { data: audit },
    { data: donations },
    { data: subscriptions }
  ] =
    await Promise.all([
      admin
        .from("reports")
        .select("id, reporter_id, reported_profile_id, post_id, offer_id, message_id, reason, status, created_at, reviewed_at")
        .order("created_at", { ascending: false })
        .limit(50),
      admin.from("profiles").select("id, display_name, handle, created_at").order("created_at", { ascending: false }).limit(100),
      admin.from("posts").select("id, owner_id, title, status").order("created_at", { ascending: false }).limit(200),
      admin.from("messages").select("id, body, sender_id").order("created_at", { ascending: false }).limit(200),
      admin.from("offers").select("id, requester_id, recipient_id, offered_item, requested_item, status").order("created_at", { ascending: false }).limit(200),
      admin.from("account_moderation").select("profile_id, status, reason, updated_at"),
      admin
        .from("moderation_audit_log")
        .select("id, actor_id, action, report_id, target_profile_id, target_post_id, note, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
      admin
        .from("donations")
        .select("id, profile_id, amount_cents, currency, donor_email, donor_name, receipt_sent_at, receipt_error, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
      admin
        .from("profile_private")
        .select(
          "profile_id, email, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_current_period_end, subscription_cancel_at_period_end, subscription_last_payment_status"
        )
        .neq("subscription_status", "none")
        .order("updated_at", { ascending: false })
        .limit(25)
    ]);

  const typedReports = (reports ?? []) as ReportRow[];
  const profileMap = keyById((profiles ?? []) as ProfileRow[]);
  const postMap = keyById((posts ?? []) as PostRow[]);
  const messageMap = keyById((messages ?? []) as MessageRow[]);
  const offerMap = keyById((offers ?? []) as OfferRow[]);
  const moderationMap = new Map(((moderation ?? []) as ModerationRow[]).map((row) => [row.profile_id, row]));
  const openReports = typedReports.filter((report) => report.status === "open" || report.status === "reviewing");
  const totalDonations = ((donations ?? []) as DonationRow[]).reduce((total, donation) => total + donation.amount_cents, 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">
            <ShieldAlert size={15} aria-hidden /> {role}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]">Admin</h1>
        </div>
        <p className="text-[13px] text-muted">Signed in as {profileLabel(profileMap.get(user.id))}</p>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.02em]">Reports queue</h2>
            <p className="mt-1 text-[13px] text-muted">{openReports.length} open or reviewing reports</p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {typedReports.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white p-5 text-[13px] text-muted">No reports yet.</p>
          ) : (
            typedReports.map((report) => {
              const reporter = report.reporter_id ? profileMap.get(report.reporter_id) : null;
              const reportedProfile = report.reported_profile_id ? profileMap.get(report.reported_profile_id) : null;
              const post = report.post_id ? postMap.get(report.post_id) : null;
              const message = report.message_id ? messageMap.get(report.message_id) : null;
              const offer = report.offer_id ? offerMap.get(report.offer_id) : null;
              const profileModeration = report.reported_profile_id ? moderationMap.get(report.reported_profile_id) : null;

              return (
                <article key={report.id} className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={reportTone(report.status)}>{report.status}</Badge>
                        <span className="text-xs text-muted">{timeAgo(report.created_at)}</span>
                      </div>
                      <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#3d3d3d]">
                        {report.reason}
                      </p>
                    </div>
                    {report.status !== "reviewing" && report.status !== "actioned" && (
                      <form action={setReportReviewing}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <button className={secondaryButtonClass}>Review</button>
                      </form>
                    )}
                  </div>

                  <dl className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="font-semibold text-ink">Reporter</dt>
                      <dd className="text-muted">{profileLabel(reporter)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-ink">Profile</dt>
                      <dd className="text-muted">{profileLabel(reportedProfile)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-ink">Post</dt>
                      <dd className="text-muted">{post ? `${post.title} (${post.status})` : "None"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-ink">Offer/message</dt>
                      <dd className="text-muted">
                        {offer ? `${offer.offered_item} for ${offer.requested_item} (${offer.status})` : "None"}
                      </dd>
                    </div>
                  </dl>

                  {message && (
                    <p className="mt-4 rounded-xl bg-[#f7f7f7] px-4 py-3 text-[13px] leading-6 text-[#3d3d3d]">
                      {message.body}
                    </p>
                  )}

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <form action={dismissReport} className="space-y-2">
                      <input type="hidden" name="reportId" value={report.id} />
                      <NoteField id={`dismiss-${report.id}`} />
                      <button className={ghostButtonClass}>Dismiss report</button>
                    </form>

                    <form action={actionReport} className="space-y-2">
                      <input type="hidden" name="reportId" value={report.id} />
                      <NoteField id={`action-${report.id}`} />
                      <button className={primaryButtonClass}>Mark actioned</button>
                    </form>

                    <div className="space-y-2">
                      {post && (
                        <form action={post.status === "hidden" ? restorePost : hidePost} className="flex flex-wrap gap-2">
                          <input type="hidden" name="reportId" value={report.id} />
                          <input type="hidden" name="postId" value={post.id} />
                          <input type="hidden" name="note" value={`Report ${report.id}`} />
                          <button className={secondaryButtonClass}>{post.status === "hidden" ? "Restore post" : "Hide post"}</button>
                        </form>
                      )}
                      {reportedProfile && (
                        <div className="flex flex-wrap gap-2">
                          <form action={profileModeration?.status === "suspended" ? unsuspendProfile : suspendProfile}>
                            <input type="hidden" name="reportId" value={report.id} />
                            <input type="hidden" name="profileId" value={reportedProfile.id} />
                            <input type="hidden" name="note" value={`Report ${report.id}`} />
                            <button className={secondaryButtonClass}>
                              {profileModeration?.status === "suspended" ? "Unsuspend user" : "Suspend user"}
                            </button>
                          </form>
                          <form action={profileModeration?.status === "blocked" ? unblockProfileFromAdmin : blockProfileFromAdmin}>
                            <input type="hidden" name="reportId" value={report.id} />
                            <input type="hidden" name="profileId" value={reportedProfile.id} />
                            <input type="hidden" name="note" value={`Report ${report.id}`} />
                            <button className={secondaryButtonClass}>
                              {profileModeration?.status === "blocked" ? "Unblock user" : "Block user"}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-[-0.02em]">Contributions</h2>
              <p className="mt-1 text-[13px] text-muted">
                {money(totalDonations, "usd")} across the latest {((donations ?? []) as DonationRow[]).length} records
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
            {((donations ?? []) as DonationRow[]).length === 0 ? (
              <p className="p-5 text-[13px] text-muted">No Stripe contributions recorded yet.</p>
            ) : (
              ((donations ?? []) as DonationRow[]).map((donation) => (
                <div key={donation.id} className="border-b border-line px-5 py-4 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{money(donation.amount_cents, donation.currency)}</p>
                    <Badge tone={donation.receipt_sent_at ? "soft" : donation.receipt_error ? "solid" : "outline"}>
                      {donation.receipt_sent_at ? "receipt sent" : donation.receipt_error ? "receipt issue" : "receipt pending"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {donation.donor_name || donation.donor_email || profileLabel(donation.profile_id ? profileMap.get(donation.profile_id) : null)}
                    {" · "}
                    {timeAgo(donation.created_at)}
                  </p>
                  {donation.receipt_error && (
                    <p className="mt-2 text-xs font-medium text-red-700">{donation.receipt_error}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-[-0.02em]">Recurring platform support</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
            {((subscriptions ?? []) as PrivateProfileRow[]).length === 0 ? (
              <p className="p-5 text-[13px] text-muted">No recurring support records yet.</p>
            ) : (
              ((subscriptions ?? []) as PrivateProfileRow[]).map((subscription) => (
                <div key={subscription.profile_id} className="border-b border-line px-5 py-4 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{profileLabel(profileMap.get(subscription.profile_id))}</p>
                    <Badge tone={subscription.subscription_status === "active" ? "outline" : "soft"}>
                      {subscription.subscription_status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {subscription.email ?? "No email"}
                    {subscription.subscription_current_period_end
                      ? ` · renews ${new Date(subscription.subscription_current_period_end).toLocaleDateString("en-US")}`
                      : ""}
                  </p>
                  {subscription.subscription_cancel_at_period_end && (
                    <p className="mt-2 text-xs font-medium text-red-700">Cancels at period end</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.02em]">Members</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
            {((profiles ?? []) as ProfileRow[]).map((profile) => {
              const status = moderationMap.get(profile.id)?.status ?? "active";
              return (
                <div key={profile.id} className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4 last:border-b-0">
                  <div className="min-w-48 flex-1">
                    {profile.handle ? (
                      <Link href={`/profiles/${profile.handle}`} className="text-sm font-semibold hover:underline">
                        {profileLabel(profile)}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold">{profile.display_name}</p>
                    )}
                    <p className="text-xs text-muted">Joined {timeAgo(profile.created_at)}</p>
                  </div>
                  <Badge tone={status === "suspended" ? "solid" : "soft"}>{status}</Badge>
                  <form action={status === "suspended" ? unsuspendProfile : suspendProfile}>
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="note" value="Admin member list action" />
                    <button className={ghostButtonClass} disabled={profile.id === user.id}>
                      {status === "suspended" ? "Unsuspend" : "Suspend"}
                    </button>
                  </form>
                  <form action={status === "blocked" ? unblockProfileFromAdmin : blockProfileFromAdmin}>
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="note" value="Admin member list action" />
                    <button className={ghostButtonClass} disabled={profile.id === user.id}>
                      {status === "blocked" ? "Unblock" : "Block"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>

        <aside>
          <h2 className="text-xl font-bold tracking-[-0.02em]">Audit log</h2>
          <div className="mt-4 space-y-3">
            {((audit ?? []) as AuditRow[]).map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold">{entry.action.replaceAll("_", " ")}</p>
                  <span className="text-xs text-muted">{timeAgo(entry.created_at)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {profileLabel(entry.actor_id ? profileMap.get(entry.actor_id) : null)}
                </p>
                {entry.note && <p className="mt-2 text-[13px] leading-5 text-[#3d3d3d]">{entry.note}</p>}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
