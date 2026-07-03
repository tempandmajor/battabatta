import Link from "next/link";
import { Avatar, avatarTone } from "@/components/avatar";
import { threadTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ThreadSummary = {
  offer_id: string;
  other_id: string;
  other_display_name: string;
  other_handle: string | null;
  offered_item: string;
  requested_item: string;
  status: string;
  last_message_body: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
  created_at: string;
};

export function ThreadList({ threads, activeOfferId, selfId }: { threads: ThreadSummary[]; activeOfferId?: string; selfId: string }) {
  return (
    <div className="overflow-y-auto">
      {threads.map((thread) => {
        const unread = thread.unread_count > 0 && thread.offer_id !== activeOfferId;
        const preview = thread.last_message_body
          ? `${thread.last_message_sender_id === selfId ? "You: " : ""}${thread.last_message_body}`
          : `Offer · ${thread.offered_item} for ${thread.requested_item}`;
        return (
          <Link
            key={thread.offer_id}
            href={`/messages/${thread.offer_id}`}
            className={cn(
              "flex w-full gap-3 border-b border-[#f2f2f2] px-5 py-4 text-left hover:bg-[#f7f7f7]",
              thread.offer_id === activeOfferId && "bg-[#f7f7f7]"
            )}
            aria-current={thread.offer_id === activeOfferId ? "page" : undefined}
          >
            <Avatar name={thread.other_display_name} tone={avatarTone(thread.other_id)} size="md" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                {thread.other_display_name}
                <span className="text-[11px] font-normal text-[#8a8a8a]">
                  {threadTime(thread.last_message_at ?? thread.created_at)}
                </span>
              </span>
              <span
                className={cn(
                  "block truncate text-[12.5px]",
                  unread ? "font-semibold text-ink" : "text-[#8a8a8a]"
                )}
              >
                {preview}
              </span>
            </span>
            {unread && <span aria-label={`${thread.unread_count} unread`} className="mt-1.5 size-2 shrink-0 rounded-full bg-ink" />}
          </Link>
        );
      })}
    </div>
  );
}
