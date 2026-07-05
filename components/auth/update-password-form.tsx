"use client";

import { useActionState } from "react";
import { updatePassword, type FormState } from "@/lib/actions/auth";
import { Field, FormAlert, primaryButtonClass } from "@/components/ui";
import { PasswordInput } from "@/components/auth/password-input";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updatePassword, {});

  return (
    <form action={formAction} className="space-y-4">
      <Field label="New password" htmlFor="password" hint="At least 8 characters.">
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>
      <FormAlert error={state.error} message={state.message} />
      <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full`}>
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
