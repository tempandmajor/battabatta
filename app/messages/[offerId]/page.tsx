import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Handshake, Shield, UserRoundX } from "lucide-react";
import { Avatar, avatarTone } from "@/components/avatar";
import { ReportDialog } from "@/components/report-dialog";
import { ThreadList, type ThreadSummary } from "@/components/thread-list";
import { ThreadMessages, type ThreadMessage } from "@/components/thread-messages";
import { ghostButtonClass } from "@/components/ui";
import { respondToOffer } from "@/lib/actions/offers";
import { blockProfile } from "@/lib/actions/social";
import { requireOnboardedUser } from "@/lib/auth";
import { OFFER_STATUS_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "Messages · Battarbox" };

function offerStatusText(status: string, isRequester: boolean): string {
  switch (status) {
    case "interested":
      return "This offer was marked as interested. Keep coordinating below.";
    case "countered":
      return isRequester
        ? "They countered. Accept, decline, or withdraw below."
        : "You sent a counter. Waiting for a reply.";
    case "declined":
      return "This offer was declined.";
    case "withdrawn":
      return "This offer was withdrawn.";
    case "closed_by_user":
      return "This conversation was closed.";
    default:
      return "";
  }
}

export default async function ThreadPage({
  params,
  searchParams
}: {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { offerId } = await params;
  const { error: actionError } = await searchParams;
  const { supabase, user } = await requireOnboardedUser("/messages");

  const { data: offer } = await supabase
    .from("offers")
    .select("id, post_id, requester_id, recipient_id, offered_item, requested_item, timing, status")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer) notFound();

  const isRequester = offer.requester_id === user.id;
  const otherId = isRequester ? offer.recipient_id : offer.requester_id;

  const [{ data: other }, { data: messages }, { data: threads }, { data: post }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, handle, avatar_url").eq("id", otherId).single(),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("offer_id", offerId)
      .is("deleted_at", null)
      .order("created_at"),
    supabase.rpc("list_threads"),
    offer.post_id
      ? supabase.from("posts").select("id, title").eq("id", offer.post_id).maybeSingle()
      : Promise.resolve({ data: null })
  ]);
  if (!other) notFound();

  const canRespond = offer.status === "pending" && !isRequester;
  const canActOnCounter = offer.status === "countered" && isRequester;
  const canWithdraw = (offer.status === "pending" || offer.status === "countered") && isRequester;
  const canClose = offer.status === "interested";
  const statusText = offerStatusText(offer.status, isRequester);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <div className="grid min-h-[520px] overflow-hidden rounded-[18px] border border-line bg-white lg:h-[calc(100vh-130px)] lg:grid-cols-[320px_1fr]">
        <aside className="hidden min-h-0 flex-col border-r border-line lg:flex">
          <h1 className="border-b border-line px-5 py-5 text-lg font-bold tracking-[-0.02em]">Messages</h1>
          <ThreadList threads={(threads ?? []) as ThreadSummary[]} activeOfferId={offerId} selfId={user.id} />
        </aside>

        <div className="flex min-h-0 flex-col">
          <div className="flex items-center gap-3 border-b border-line px-6 py-3.5">
            <Link href="/messages" className="text-[13px] font-medium text-muted hover:text-ink lg:hidden">
              ← All
            </Link>
            <Avatar name={other.display_name} avatarPath={other.avatar_url} tone={avatarTone(other.id)} size="md" />
            <div className="leading-tight">
              {other.handle ? (
                <Link href={`/profiles/${other.handle}`} className="text-sm font-semibold hover:underline">
                  {other.display_name}
                </Link>
              ) : (
                <p className="text-sm font-semibold">{other.display_name}</p>
              )}
              <p className="text-xs text-[#8a8a8a]">
                {post ? `Offer · ${post.title}` : `Offer · ${offer.offered_item}`}
              </p>
            </div>
            <div className="ml-auto flex gap-2">
              <ReportDialog offerId={offer.id} reportedProfileId={other.id} />
              <form action={blockProfile}>
                <input type="hidden" name="blockedId" value={other.id} />
                <button type="submit" className={ghostButtonClass}>
                  <UserRoundX size={14} className="mr-1.5" aria-hidden /> Block
                </button>
              </form>
            </div>
          </div>

          <div className="mx-6 mt-4 rounded-[14px] border border-line bg-[#fafafa] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase text-white">
                  {OFFER_STATUS_LABEL[offer.status]}
                </span>
                <strong>{offer.offered_item}</strong>
                <Handshake size={15} className="text-[#8a8a8a]" aria-hidden />
                <strong>{offer.requested_item}</strong>
                {offer.timing && <span className="text-xs text-[#8a8a8a]">{offer.timing}</span>}
              </div>

              <div className="flex flex-wrap gap-2">
                {(canRespond || canActOnCounter) && (
                  <form action={respondToOffer}>
                    <input type="hidden" name="offerId" value={offer.id} />
                    <input type="hidden" name="action" value="interested" />
                    <button className="rounded-full border border-ink bg-ink px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-85">
                      Interested
                    </button>
                  </form>
                )}
                {canRespond && (
                  <form action={respondToOffer}>
                    <input type="hidden" name="offerId" value={offer.id} />
                    <input type="hidden" name="action" value="countered" />
                    <button className="rounded-full border border-ink px-4 py-2 text-[12.5px] font-semibold hover:bg-mist">
                      Counter
                    </button>
                  </form>
                )}
                {(canRespond || canActOnCounter) && (
                  <form action={respondToOffer}>
                    <input type="hidden" name="offerId" value={offer.id} />
                    <input type="hidden" name="action" value="declined" />
                    <button className="rounded-full border border-line px-4 py-2 text-[12.5px] font-medium text-muted hover:border-ink hover:text-ink">
                      Decline
                    </button>
                  </form>
                )}
                {canWithdraw && (
                  <form action={respondToOffer}>
                    <input type="hidden" name="offerId" value={offer.id} />
                    <input type="hidden" name="action" value="withdrawn" />
                    <button className="rounded-full border border-line px-4 py-2 text-[12.5px] font-medium text-muted hover:border-ink hover:text-ink">
                      Withdraw
                    </button>
                  </form>
                )}
                {canClose && (
                  <form action={respondToOffer}>
                    <input type="hidden" name="offerId" value={offer.id} />
                    <input type="hidden" name="action" value="closed" />
                    <button className="rounded-full border border-line px-4 py-2 text-[12.5px] font-medium text-muted hover:border-ink hover:text-ink">
                      Close conversation
                    </button>
                  </form>
                )}
              </div>
            </div>

            {statusText && <p className="mt-3 text-[12.5px] font-semibold">{statusText}</p>}
            {actionError && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-700">
                {actionError}
              </p>
            )}
            <p className="mt-3 flex items-center gap-2 text-xs text-muted">
              <Shield size={14} aria-hidden /> Offers are non-binding. Battarbox does not process settlement,
              valuation, escrow, or completion accounting.
            </p>
          </div>

          <ThreadMessages offerId={offer.id} selfId={user.id} initialMessages={(messages ?? []) as ThreadMessage[]} />
        </div>
      </div>
    </main>
  );
}
