"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { updateProfile } from "@/lib/actions/profile";
import type { FormState } from "@/lib/actions/auth";
import { LocationField } from "@/components/location-field";
import { Field, FormAlert, inputClass, primaryButtonClass } from "@/components/ui";

export function SettingsForm({
  profile,
  interests
}: {
  profile: {
    display_name: string;
    handle: string | null;
    bio: string;
    public_location_label: string | null;
    location_mode: string;
    is_paused: boolean;
  };
  interests: string[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateProfile, {});
  const [interestList, setInterestList] = useState<string[]>(interests);
  const [interestDraft, setInterestDraft] = useState("");

  function addInterest() {
    const label = interestDraft.trim();
    if (label.length < 2 || interestList.includes(label) || interestList.length >= 20) return;
    setInterestList((list) => [...list, label]);
    setInterestDraft("");
  }

  return (
    <form action={formAction} className="space-y-5">
      {interestList.map((label) => (
        <input key={label} type="hidden" name="interests" value={label} />
      ))}

      <Field label="Profile photo" htmlFor="avatar" hint="Optional. JPEG/PNG/WebP, 5 MB max.">
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-[13px] text-muted file:mr-3 file:rounded-full file:border file:border-line file:bg-white file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-ink hover:file:border-ink"
        />
      </Field>

      <Field label="Display name" htmlFor="displayName">
        <input
          id="displayName"
          name="displayName"
          defaultValue={profile.display_name}
          required
          minLength={2}
          maxLength={80}
          className={inputClass}
        />
      </Field>

      <Field label="Handle" htmlFor="handle">
        <input
          id="handle"
          name="handle"
          defaultValue={profile.handle ?? ""}
          required
          pattern="[a-z0-9_]{3,32}"
          title="3-32 characters: lowercase letters, numbers, underscores"
          className={inputClass}
        />
      </Field>

      <Field label="Bio" htmlFor="bio">
        <textarea id="bio" name="bio" defaultValue={profile.bio} rows={3} maxLength={800} className={inputClass} />
      </Field>

      <Field label="Public location label" htmlFor="publicLocationLabel" hint="Approximate only. Never your address.">
        <input
          id="publicLocationLabel"
          name="publicLocationLabel"
          defaultValue={profile.public_location_label ?? ""}
          maxLength={120}
          className={inputClass}
        />
      </Field>

      <Field label="How do you like to exchange?" htmlFor="locationMode">
        <select id="locationMode" name="locationMode" defaultValue={profile.location_mode} className={inputClass}>
          <option value="local_and_online">Local & online</option>
          <option value="local">Local only</option>
          <option value="online">Online only</option>
        </select>
      </Field>

      <LocationField />

      <div className="space-y-2">
        <span className="block text-[13px] font-semibold text-ink">Interested in</span>
        <div className="flex flex-wrap gap-2">
          {interestList.map((label) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full bg-mist px-3.5 py-1.5 text-[13px] font-medium text-[#3d3d3d]"
            >
              {label}
              <button
                type="button"
                aria-label={`Remove ${label}`}
                onClick={() => setInterestList((list) => list.filter((item) => item !== label))}
                className="rounded-full p-0.5 hover:bg-white"
              >
                <X size={12} aria-hidden />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={interestDraft}
            onChange={(event) => setInterestDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addInterest();
              }
            }}
            maxLength={80}
            placeholder="Garden produce"
            aria-label="Add an interest"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addInterest}
            className="shrink-0 rounded-lg border border-line px-4 text-[13px] font-semibold hover:border-ink"
          >
            Add
          </button>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-line bg-[#fafafa] p-4 text-[13px] leading-6 text-ink">
        <input type="checkbox" name="isPaused" defaultChecked={profile.is_paused} className="mt-1 size-4 accent-ink" />
        <span>
          <span className="font-semibold">Not offering at the moment.</span> Hides your posts from discovery and shows
          a paused badge on your profile. Existing conversations stay open.
        </span>
      </label>

      <FormAlert error={state.error} message={state.message} />

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
