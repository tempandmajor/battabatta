"use client";

import Link from "next/link";
import { useActionState } from "react";
import { completeOnboarding } from "@/lib/actions/profile";
import type { FormState } from "@/lib/actions/auth";
import { LocationField } from "@/components/location-field";
import { Field, FormAlert, inputClass, primaryButtonClass } from "@/components/ui";

export function OnboardingForm({
  defaultDisplayName,
  defaultHandle
}: {
  defaultDisplayName: string;
  defaultHandle: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(completeOnboarding, {});

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Display name" htmlFor="displayName">
        <input
          id="displayName"
          name="displayName"
          defaultValue={defaultDisplayName}
          required
          minLength={2}
          maxLength={80}
          className={inputClass}
        />
      </Field>

      <Field label="Handle" htmlFor="handle" hint="Your public profile URL: battarbox.com/profiles/your-handle">
        <input
          id="handle"
          name="handle"
          defaultValue={defaultHandle}
          required
          pattern="[a-z0-9_]{3,32}"
          title="3-32 characters: lowercase letters, numbers, underscores"
          className={inputClass}
        />
      </Field>

      <Field label="Bio" htmlFor="bio" hint="What do you like to trade?">
        <textarea id="bio" name="bio" rows={3} maxLength={800} className={inputClass} />
      </Field>

      <Field
        label="Public location label"
        htmlFor="publicLocationLabel"
        hint={'Approximate only, e.g. "Near Ballard, Seattle". Never enter your address.'}
      >
        <input id="publicLocationLabel" name="publicLocationLabel" maxLength={120} className={inputClass} />
      </Field>

      <Field label="How do you like to exchange?" htmlFor="locationMode">
        <select id="locationMode" name="locationMode" defaultValue="local_and_online" className={inputClass}>
          <option value="local_and_online">Local & online</option>
          <option value="local">Local only</option>
          <option value="online">Online only</option>
        </select>
      </Field>

      <LocationField />

      <div className="space-y-3 rounded-xl border border-line bg-[#fafafa] p-4">
        <label className="flex items-start gap-3 text-[13px] leading-6 text-ink">
          <input type="checkbox" name="isAdultConfirmed" required className="mt-1 size-4 accent-ink" />
          <span>I confirm that I am 18 years of age or older.</span>
        </label>
        <label className="flex items-start gap-3 text-[13px] leading-6 text-ink">
          <input type="checkbox" name="acceptsTerms" required className="mt-1 size-4 accent-ink" />
          <span>
            I accept the{" "}
            <Link href="/legal/terms" target="_blank" className="font-semibold underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" target="_blank" className="font-semibold underline">
              Privacy Policy
            </Link>
            , and I understand offers on Battarbox are non-binding and never settled through the platform.
          </span>
        </label>
      </div>

      <FormAlert error={state.error} message={state.message} />

      <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full`}>
        {pending ? "Saving..." : "Start bartering"}
      </button>
    </form>
  );
}
