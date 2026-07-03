"use client";

import { useActionState, useState } from "react";
import { createPost, updatePost } from "@/lib/actions/posts";
import type { FormState } from "@/lib/actions/auth";
import { Field, FormAlert, inputClass, primaryButtonClass } from "@/components/ui";
import { publicStorageUrl } from "@/lib/utils";

export type PostFormValues = {
  id?: string;
  kind: string;
  category: string;
  title: string;
  body: string;
  what_i_can_give: string | null;
  location_mode: string;
  approval_policy: string;
  availability_total: number | null;
  availability_unit: string | null;
  status?: string;
};

export type ExistingPhoto = { id: string; path: string };

export function PostForm({ post, existingPhotos = [] }: { post?: PostFormValues; existingPhotos?: ExistingPhoto[] }) {
  const isEdit = Boolean(post?.id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(isEdit ? updatePost : createPost, {});
  const [limited, setLimited] = useState(post?.availability_total !== null && post?.availability_total !== undefined);

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && <input type="hidden" name="postId" value={post!.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="I am" htmlFor="kind">
          <select id="kind" name="kind" defaultValue={post?.kind ?? "offering"} className={inputClass}>
            <option value="offering">Offering something</option>
            <option value="seeking">Seeking something</option>
          </select>
        </Field>
        <Field label="Category" htmlFor="category">
          <select id="category" name="category" defaultValue={post?.category ?? "goods"} className={inputClass}>
            <option value="goods">Goods</option>
            <option value="services">Services</option>
          </select>
        </Field>
      </div>

      <Field label="Title" htmlFor="title">
        <input
          id="title"
          name="title"
          defaultValue={post?.title}
          required
          minLength={4}
          maxLength={140}
          placeholder="Furniture repair for garden produce"
          className={inputClass}
        />
      </Field>

      <Field label="Description" htmlFor="body">
        <textarea
          id="body"
          name="body"
          defaultValue={post?.body}
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="What are you offering or seeking? What condition, what timing, what would a fair trade look like?"
          className={inputClass}
        />
      </Field>

      <Field
        label="What I can give (for seeking posts)"
        htmlFor="whatICanGive"
        hint="Optional. Shown as “Can give” on your post."
      >
        <input
          id="whatICanGive"
          name="whatICanGive"
          defaultValue={post?.what_i_can_give ?? ""}
          maxLength={500}
          className={inputClass}
        />
      </Field>

      {existingPhotos.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-[13px] font-semibold text-ink">Current photos</legend>
          <div className="flex flex-wrap gap-3">
            {existingPhotos.map((photo) => (
              <label key={photo.id} className="group relative cursor-pointer">
                <img
                  src={publicStorageUrl("post-photos", photo.path)}
                  alt=""
                  className="size-24 rounded-xl border border-line object-cover group-has-[input:checked]:opacity-40"
                />
                <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium">
                  <input type="checkbox" name="removePhotoIds" value={photo.id} className="size-3 accent-ink" />
                  Remove
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <Field label="Photos" htmlFor="photos" hint="Optional. Up to 3 photos, JPEG/PNG/WebP, 5 MB each.">
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="block w-full text-[13px] text-muted file:mr-3 file:rounded-full file:border file:border-line file:bg-white file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-ink hover:file:border-ink"
        />
      </Field>

      <Field label="Where" htmlFor="locationMode">
        <select id="locationMode" name="locationMode" defaultValue={post?.location_mode ?? "local"} className={inputClass}>
          <option value="local">Local only</option>
          <option value="online">Online only</option>
          <option value="local_and_online">Local & online</option>
        </select>
      </Field>

      <div className="space-y-3 rounded-xl border border-line bg-[#fafafa] p-4">
        <label className="flex items-start gap-3 text-[13px] leading-6 text-ink">
          <input
            type="checkbox"
            checked={limited}
            onChange={(event) => setLimited(event.target.checked)}
            className="mt-1 size-4 accent-ink"
          />
          <span>
            <span className="font-semibold">Limit availability.</span> Cap how many people can claim this offer, e.g.
            “4 produce boxes” or “2 tutoring slots”.
          </span>
        </label>
        {limited && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Total available" htmlFor="availabilityTotal">
              <input
                id="availabilityTotal"
                name="availabilityTotal"
                type="number"
                min={1}
                max={1000}
                defaultValue={post?.availability_total ?? 1}
                className={inputClass}
              />
            </Field>
            <Field label="Unit" htmlFor="availabilityUnit">
              <input
                id="availabilityUnit"
                name="availabilityUnit"
                defaultValue={post?.availability_unit ?? ""}
                placeholder="produce boxes"
                minLength={2}
                maxLength={80}
                className={inputClass}
              />
            </Field>
            <Field label="Approval" htmlFor="approvalPolicy">
              <select
                id="approvalPolicy"
                name="approvalPolicy"
                defaultValue={post?.approval_policy ?? "manual_approval"}
                className={inputClass}
              >
                <option value="manual_approval">I approve each one</option>
                <option value="auto_accept_until_limit">Auto-accept until full</option>
              </select>
            </Field>
          </div>
        )}
        {!limited && <input type="hidden" name="approvalPolicy" value="manual_approval" />}
      </div>

      {isEdit && (
        <Field label="Status" htmlFor="status">
          <select id="status" name="status" defaultValue={post?.status ?? "active"} className={inputClass}>
            <option value="active">Active</option>
            <option value="paused">Paused (hidden from discovery)</option>
          </select>
        </Field>
      )}

      <FormAlert error={state.error} message={state.message} />

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Saving..." : isEdit ? "Save changes" : "Publish post"}
      </button>

      <p className="text-xs leading-5 text-muted">
        Posts are non-binding. Never include your exact address or contact details; coordinate specifics in Messages
        after an offer.
      </p>
    </form>
  );
}
