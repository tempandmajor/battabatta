"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOnboardedUser } from "@/lib/auth";
import { messageSchema, offerActionSchema, offerSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth";

export async function createOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireOnboardedUser();

  const parsed = offerSchema.safeParse({
    recipientId: formData.get("recipientId"),
    postId: formData.get("postId") || undefined,
    offeredItem: formData.get("offeredItem"),
    requestedItem: formData.get("requestedItem"),
    timing: formData.get("timing") ?? "",
    note: formData.get("note") ?? ""
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }
  if (parsed.data.recipientId === user.id) {
    return { error: "You cannot make an offer to yourself" };
  }

  let requiresApproval = true;
  if (parsed.data.postId) {
    const { data: post } = await supabase
      .from("posts")
      .select("approval_policy")
      .eq("id", parsed.data.postId)
      .maybeSingle();
    requiresApproval = post?.approval_policy !== "auto_accept_until_limit";
  }

  const { data: offer, error } = await supabase
    .from("offers")
    .insert({
      requester_id: user.id,
      recipient_id: parsed.data.recipientId,
      post_id: parsed.data.postId ?? null,
      offered_item: parsed.data.offeredItem,
      requested_item: parsed.data.requestedItem,
      timing: parsed.data.timing || null,
      note: parsed.data.note || null,
      requires_approval: requiresApproval
    })
    .select("id")
    .single();
  if (error || !offer) {
    // RLS blocks offers between blocked members; surface that gently.
    if (error?.code === "42501") return { error: "You cannot send offers to this member." };
    return { error: error?.message ?? "Could not send the offer" };
  }

  if (parsed.data.note) {
    await supabase.from("messages").insert({
      offer_id: offer.id,
      sender_id: user.id,
      body: parsed.data.note
    });
  }

  revalidatePath("/messages");
  redirect(`/messages/${offer.id}`);
}

export async function respondToOffer(formData: FormData): Promise<void> {
  const { supabase } = await requireOnboardedUser();
  const offerId = String(formData.get("offerId") ?? "");
  const action = offerActionSchema.safeParse(formData.get("action"));
  if (!action.success) redirect("/messages");

  const { error } = await supabase.rpc("respond_to_offer", {
    p_offer_id: offerId,
    p_action: action.data
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${offerId}`);
  if (error) {
    redirect(`/messages/${offerId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/messages/${offerId}`);
}

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireOnboardedUser();

  const parsed = messageSchema.safeParse({
    offerId: formData.get("offerId"),
    body: formData.get("body")
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write a message" };
  }

  const { error } = await supabase.from("messages").insert({
    offer_id: parsed.data.offerId,
    sender_id: user.id,
    body: parsed.data.body
  });
  if (error) {
    if (error.code === "42501") return { error: "You can no longer message in this thread." };
    return { error: error.message };
  }

  await supabase.from("thread_reads").upsert({
    offer_id: parsed.data.offerId,
    profile_id: user.id,
    last_read_at: new Date().toISOString()
  });

  revalidatePath(`/messages/${parsed.data.offerId}`);
  return {};
}

export async function markThreadRead(offerId: string): Promise<void> {
  const { supabase, user } = await requireOnboardedUser();
  await supabase.from("thread_reads").upsert({
    offer_id: offerId,
    profile_id: user.id,
    last_read_at: new Date().toISOString()
  });
  revalidatePath("/messages");
}
