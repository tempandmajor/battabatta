"use client";

import { useActionState, useState } from "react";
import { Flag } from "lucide-react";
import { submitReport } from "@/lib/actions/social";
import type { FormState } from "@/lib/actions/auth";
import { Field, FormAlert, ghostButtonClass, inputClass, primaryButtonClass } from "@/components/ui";

/**
 * Report button + inline dialog. Exactly one target id should be provided.
 */
export function ReportDialog({
  reportedProfileId,
  postId,
  offerId,
  label = "Report"
}: {
  reportedProfileId?: string;
  postId?: string;
  offerId?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(submitReport, {});

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={ghostButtonClass}>
        <Flag size={14} className="mr-1.5" aria-hidden />
        {label}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Report"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-5"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6">
            <h2 className="text-lg font-bold tracking-[-0.02em]">Report to moderators</h2>
            <p className="mt-1 text-[13px] leading-6 text-muted">
              Tell us what is unsafe, prohibited, or against the rules. Reports are confidential.
            </p>
            <form action={formAction} className="mt-4 space-y-4">
              {reportedProfileId && <input type="hidden" name="reportedProfileId" value={reportedProfileId} />}
              {postId && <input type="hidden" name="postId" value={postId} />}
              {offerId && <input type="hidden" name="offerId" value={offerId} />}
              <Field label="What happened?" htmlFor="report-reason">
                <textarea
                  id="report-reason"
                  name="reason"
                  required
                  minLength={4}
                  maxLength={500}
                  rows={4}
                  className={inputClass}
                />
              </Field>
              <FormAlert error={state.error} message={state.message} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className={ghostButtonClass}>
                  {state.message ? "Close" : "Cancel"}
                </button>
                {!state.message && (
                  <button type="submit" disabled={pending} className={primaryButtonClass}>
                    {pending ? "Sending..." : "Submit report"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
