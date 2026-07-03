"use client";

import { useActionState } from "react";
import { Handshake, Shield } from "lucide-react";
import { createOffer } from "@/lib/actions/offers";
import type { FormState } from "@/lib/actions/auth";
import { Field, FormAlert, inputClass, primaryButtonClass } from "@/components/ui";

export function OfferForm({
  recipientId,
  postId,
  defaultRequestedItem
}: {
  recipientId: string;
  postId?: string;
  defaultRequestedItem?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createOffer, {});

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line bg-white p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.02em]">
        <Handshake size={18} aria-hidden /> Make an offer
      </h2>
      <input type="hidden" name="recipientId" value={recipientId} />
      {postId && <input type="hidden" name="postId" value={postId} />}

      <Field label="I am offering" htmlFor="offeredItem">
        <input
          id="offeredItem"
          name="offeredItem"
          required
          minLength={2}
          maxLength={240}
          placeholder="Portrait commission"
          className={inputClass}
        />
      </Field>
      <Field label="In exchange for" htmlFor="requestedItem">
        <input
          id="requestedItem"
          name="requestedItem"
          defaultValue={defaultRequestedItem}
          required
          minLength={2}
          maxLength={240}
          placeholder="2 photography lessons"
          className={inputClass}
        />
      </Field>
      <Field label="Timing" htmlFor="timing" hint="Optional.">
        <input id="timing" name="timing" maxLength={240} placeholder="Next two weekends" className={inputClass} />
      </Field>
      <Field label="Note" htmlFor="note" hint="Optional. Sent as your first message.">
        <textarea id="note" name="note" maxLength={2000} rows={3} className={inputClass} />
      </Field>

      <FormAlert error={state.error} message={state.message} />

      <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full`}>
        {pending ? "Sending..." : "Send offer"}
      </button>

      <p className="flex items-start gap-2 text-xs leading-5 text-muted">
        <Shield size={14} className="mt-0.5 shrink-0" aria-hidden />
        Offers are non-binding. BattaBatta does not process settlement, valuation, escrow, or completion accounting.
      </p>
    </form>
  );
}
