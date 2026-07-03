"use client";

import { useState } from "react";
import { deleteAccount } from "@/lib/actions/profile";
import { ghostButtonClass, inputClass } from "@/components/ui";

export function DangerZone() {
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="mt-12 space-y-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">Delete account</h2>
      <div className="space-y-3 rounded-xl border border-red-200 p-4">
        <p className="text-[13px] leading-6 text-muted">
          Deleting your account permanently removes your profile, posts, offers, messages, saves, and follows. This
          cannot be undone.
        </p>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className={`${ghostButtonClass} border-red-300 text-red-700 hover:border-red-700 hover:text-red-800`}>
            Delete my account...
          </button>
        ) : (
          <form action={deleteAccount} className="space-y-3">
            <label htmlFor="delete-confirm" className="block text-[13px] font-semibold text-ink">
              Type <span className="font-mono">delete my account</span> to confirm
            </label>
            <input id="delete-confirm" name="confirm" required className={inputClass} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirming(false)} className={ghostButtonClass}>
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-red-700 px-5 py-2 text-[12.5px] font-semibold text-white hover:bg-red-800"
              >
                Permanently delete
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
