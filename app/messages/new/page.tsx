import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Avatar, avatarTone } from "@/components/avatar";
import { OfferForm } from "@/components/offer-form";
import { requireOnboardedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "New offer · BattaBatta" };

export default async function NewOfferPage({
  searchParams
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const { to } = await searchParams;
  if (!to) notFound();

  const { supabase, user } = await requireOnboardedUser();

  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, display_name, handle, bio, avatar_url, is_paused")
    .eq("handle", to)
    .maybeSingle();
  if (!recipient || recipient.id === user.id) notFound();

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-10 sm:px-8">
      <Link
        href={`/profiles/${recipient.handle}`}
        className="flex w-fit items-center gap-1.5 py-1 text-[13px] font-medium text-muted hover:text-ink"
      >
        <ChevronLeft size={14} aria-hidden /> Back to profile
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <Avatar
          name={recipient.display_name}
          avatarPath={recipient.avatar_url}
          tone={avatarTone(recipient.id)}
          size="md"
        />
        <div>
          <h1 className="text-xl font-bold tracking-[-0.02em]">Offer a trade to {recipient.display_name}</h1>
          {recipient.is_paused && (
            <p className="text-[13px] text-muted">They are not offering at the moment, but can still receive offers.</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <OfferForm recipientId={recipient.id} />
      </div>
    </main>
  );
}
