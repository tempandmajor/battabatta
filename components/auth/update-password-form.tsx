"use client";

import { useActionState } from "react";
import { updatePassword, type FormState } from "@/lib/actions/auth";
import { Field, FormAlert, inputClass, primaryButtonClass } from "@/components/ui";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updatePassword, {});

  return (
    <form action={formAction} className="space-y-4">
      <Field label="New password" htmlFor="password" hint="At least 8 characters.">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </Field>
      <FormAlert error={state.error} message={state.message} />
      <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full`}>
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
