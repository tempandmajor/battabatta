"use client";

import { useActionState } from "react";
import { MailPlus } from "lucide-react";
import { sendInvite } from "@/lib/actions/invites";
import type { FormState } from "@/lib/actions/auth";
import { Field, FormAlert, inputClass, primaryButtonClass } from "@/components/ui";

export function InviteForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(sendInvite, {});

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        <MailPlus size={18} aria-hidden />
        <h2 className="text-lg font-bold tracking-[-0.02em]">Invite a friend</h2>
      </div>
      <Field label="Email" htmlFor="invite-email" hint="You can send up to 5 invites per day.">
        <input id="invite-email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>
      <FormAlert error={state.error} message={state.message} />
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Sending..." : "Send invite"}
      </button>
    </form>
  );
}
