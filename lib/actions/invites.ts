"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { requireOnboardedUser } from "@/lib/auth";
import { hashInviteToken } from "@/lib/invites";
import { getSiteUrl } from "@/lib/utils";
import { inviteSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth";

const DAILY_INVITE_LIMIT = 5;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inviteEmailHtml({
  inviterName,
  inviteUrl
}: {
  inviterName: string;
  inviteUrl: string;
}) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111111">
      <h1 style="font-size:22px;margin:0 0 12px">You're invited to Battarbox</h1>
      <p>${escapeHtml(inviterName)} invited you to join Battarbox, a free-first barter discovery app for local and online exchanges.</p>
      <p><a href="${inviteUrl}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700">Create your account</a></p>
      <p style="font-size:13px;color:#666666">Battarbox supports non-binding barter conversations only. It does not process user-to-user payments, escrow, settlement, valuation, or completion accounting.</p>
    </div>
  `;
}

export async function sendInvite(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, profile } = await requireOnboardedUser("/invite");
  const parsed = inviteSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address" };
  }

  const inviteeEmail = parsed.data.email;
  if (inviteeEmail === user.email?.toLowerCase()) {
    return { error: "Invite a different email address." };
  }

  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("invites")
    .select("*", { count: "exact", head: true })
    .eq("inviter_id", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= DAILY_INVITE_LIMIT) {
    return { error: "You have reached today's invite limit. Try again tomorrow." };
  }

  const { data: blockedInvite } = await admin
    .from("invites")
    .select("id")
    .eq("invitee_email", inviteeEmail)
    .eq("status", "blocked")
    .limit(1)
    .maybeSingle();
  if (blockedInvite) {
    return { message: "If that address can receive invites, an invitation is on the way." };
  }

  const token = crypto.randomBytes(24).toString("base64url");
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await admin
    .from("invites")
    .insert({
      inviter_id: user.id,
      invitee_email: inviteeEmail,
      token_hash: tokenHash,
      expires_at: expiresAt
    })
    .select("id")
    .single();

  if (error || !invite) {
    return { error: error?.message ?? "Could not create the invite." };
  }

  const inviteUrl = `${getSiteUrl()}/register?invite=${encodeURIComponent(token)}`;
  try {
    await sendEmail({
      to: inviteeEmail,
      subject: `${profile.display_name} invited you to Battarbox`,
      html: inviteEmailHtml({ inviterName: profile.display_name, inviteUrl }),
      text: `${profile.display_name} invited you to Battarbox. Create your account: ${inviteUrl}`
    });
  } catch (sendError) {
    await admin.from("invites").update({ status: "expired" }).eq("id", invite.id);
    return { error: sendError instanceof Error ? sendError.message : "Could not send the invite." };
  }

  revalidatePath("/invite");
  return { message: "Invite sent." };
}
