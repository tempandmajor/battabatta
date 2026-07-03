"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "@/lib/actions/auth";
import { Field, FormAlert, inputClass, primaryButtonClass } from "@/components/ui";

export function ResetForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </Field>
        <FormAlert error={state.error} message={state.message} />
        <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full`}>
          {pending ? "Sending link..." : "Send reset link"}
        </button>
      </form>
      <p className="text-[13px] text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-ink hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
