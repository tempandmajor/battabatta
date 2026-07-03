import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ThreadList, type ThreadSummary } from "@/components/thread-list";
import { secondaryButtonClass } from "@/components/ui";
import { requireOnboardedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Messages · BattaBatta" };

export default async function MessagesPage() {
  const { supabase, user } = await requireOnboardedUser("/messages");

  const { data: threads } = await supabase.rpc("list_threads");

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <div className="min-h-[520px] overflow-hidden rounded-[18px] border border-line bg-white">
        <h1 className="border-b border-line px-5 py-5 text-lg font-bold tracking-[-0.02em]">Messages</h1>
        {!threads || threads.length === 0 ? (
          <EmptyState
            title="No conversations yet."
            hint="Make an offer on a post to start a thread. Every conversation is anchored to a non-binding offer."
            action={
              <Link href="/" className={secondaryButtonClass}>
                Browse Discover
              </Link>
            }
          />
        ) : (
          <ThreadList threads={threads as ThreadSummary[]} selfId={user.id} />
        )}
      </div>
    </main>
  );
}
