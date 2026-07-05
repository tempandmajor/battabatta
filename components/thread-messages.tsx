"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { markThreadRead, sendMessage } from "@/lib/actions/offers";
import type { FormState } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export type ThreadMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const isOptimistic = (message: ThreadMessage) => message.id.startsWith("optimistic-");
const contentKey = (message: ThreadMessage) => `${message.sender_id}|${message.body}`;

/** Server rows win; optimistic entries stay only until a server row matches them. */
function mergeMessages(server: ThreadMessage[], current: ThreadMessage[]): ThreadMessage[] {
  const serverIds = new Set(server.map((message) => message.id));
  const serverKeys = new Set(server.map(contentKey));
  const kept = current.filter((message) =>
    isOptimistic(message) ? !serverKeys.has(contentKey(message)) : !serverIds.has(message.id)
  );
  return [...server, ...kept];
}

export function ThreadMessages({
  offerId,
  selfId,
  initialMessages
}: {
  offerId: string;
  selfId: string;
  initialMessages: ThreadMessage[];
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [state, formAction, pending] = useActionState<FormState, FormData>(sendMessage, {});
  const visibleMessages = messages;
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setMessages((current) => mergeMessages(initialMessages, current));
  }, [initialMessages]);

  useEffect(() => {
    void markThreadRead(offerId);

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`messages:${offerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `offer_id=eq.${offerId}` },
        (payload) => {
          const message = payload.new as ThreadMessage;
          setMessages((current) => {
            const withoutDuplicates = current.filter(
              (existing) =>
                existing.id !== message.id &&
                !(isOptimistic(existing) && contentKey(existing) === contentKey(message))
            );
            return [...withoutDuplicates, message];
          });
          if (message.sender_id !== selfId) void markThreadRead(offerId);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [offerId, selfId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [visibleMessages.length]);

  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
        {visibleMessages.length === 0 && (
          <p className="py-8 text-center text-[13px] text-muted">
            No messages yet. Say hello and work out the details.
          </p>
        )}
        {visibleMessages.map((message) => (
          <div key={message.id} className={cn("flex", message.sender_id === selfId ? "justify-end" : "justify-start")}>
            <p
              className={cn(
                "max-w-[72%] whitespace-pre-line rounded-2xl border px-4 py-3 text-[13.5px] leading-6",
                message.sender_id === selfId ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
              )}
            >
              {message.body}
            </p>
          </div>
        ))}
      </div>

      <form
        ref={formRef}
        action={formAction}
        onSubmit={(event) => {
          const body = String(new FormData(event.currentTarget).get("body") ?? "").trim();
          if (body) {
            // Keep a durable copy so the message stays visible even if the
            // action settles before the refreshed page data arrives.
            setMessages((current) => [
              ...current,
              { id: `optimistic-${current.length}`, sender_id: selfId, body, created_at: new Date().toISOString() }
            ]);
          }
          requestAnimationFrame(() => formRef.current?.reset());
        }}
        className="border-t border-line px-6 py-4"
      >
        <div className="flex gap-2.5">
          <input type="hidden" name="offerId" value={offerId} />
          <input
            name="body"
            required
            maxLength={4000}
            placeholder="Write a message..."
            aria-label="Write a message"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-full border border-line px-4 py-3 text-[13.5px] outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-ink px-6 text-[13px] font-semibold text-white hover:opacity-85 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {state.error && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-700">
            {state.error}
          </p>
        )}
      </form>
    </>
  );
}
