"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type FormState } from "@/lib/actions/auth";
import { Field, FormAlert, inputClass, primaryButtonClass } from "@/components/ui";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(register, {});

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
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
        <Field label="Confirm password" htmlFor="confirmPassword">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
        </Field>
        <FormAlert error={state.error} message={state.message} />
        <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full`}>
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-xs leading-5 text-muted">
        Battarbox is for adults (18+). After confirming your email you will be asked to confirm your age and accept
        the <Link href="/legal/terms" className="font-medium text-ink hover:underline">Terms of Use</Link> and{" "}
        <Link href="/legal/privacy" className="font-medium text-ink hover:underline">Privacy Policy</Link>.
      </p>

      <p className="text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
