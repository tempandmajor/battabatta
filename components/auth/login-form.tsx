"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signInWithGitHub, type FormState } from "@/lib/actions/auth";
import { Field, FormAlert, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(login, {
    error: initialError
  });

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </Field>
        <Field label="Password" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </Field>
        <FormAlert error={state.error} message={state.message} />
        <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full`}>
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <form action={signInWithGitHub}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className={`${secondaryButtonClass} w-full`}>
          Continue with GitHub
        </button>
      </form>

      <div className="space-y-2 text-[13px] text-muted">
        <p>
          <Link href="/reset-password" className="font-medium text-ink hover:underline">
            Forgot your password?
          </Link>
        </p>
        <p>
          New to BattaBatta?{" "}
          <Link href="/register" className="font-medium text-ink hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
