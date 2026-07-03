import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

const SUBSCRIPTION_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "unpaid"
]);

async function profileIdForCustomer(supabase: AdminClient, customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profile_private")
    .select("profile_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.profile_id ?? null;
}

async function handleCheckoutCompleted(supabase: AdminClient, session: Stripe.Checkout.Session) {
  const profileId = session.client_reference_id || session.metadata?.profile_id || null;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  // Keep the customer linked for future portal/subscription lookups.
  if (profileId && customerId) {
    await supabase
      .from("profile_private")
      .update({ stripe_customer_id: customerId })
      .eq("profile_id", profileId)
      .is("stripe_customer_id", null);
  }

  if (session.mode === "payment" && session.payment_status === "paid") {
    await supabase.from("donations").upsert(
      {
        profile_id: profileId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "usd"
      },
      { onConflict: "stripe_checkout_session_id" }
    );
  }
}

async function handleSubscriptionChange(supabase: AdminClient, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const profileId = await profileIdForCustomer(supabase, customerId);
  if (!profileId) return;

  const status = SUBSCRIPTION_STATUSES.has(subscription.status) ? subscription.status : "none";
  await supabase
    .from("profile_private")
    .update({ subscription_status: status as never })
    .eq("profile_id", profileId);
}

export async function POST(request: NextRequest) {
  const stripe = createStripeClient();
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing webhook signature configuration" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Idempotency: skip events we have already processed.
  const { data: existing } = await supabase
    .from("stripe_webhook_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(supabase, event.data.object);
        break;
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        const profileId = await profileIdForCustomer(supabase, customerId);
        if (profileId) {
          await supabase
            .from("profile_private")
            .update({ subscription_status: "canceled" })
            .eq("profile_id", profileId);
        }
        break;
      }
      default:
        break;
    }
  } catch {
    // Do not record the event: Stripe retries and we reprocess.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  const { error } = await supabase.from("stripe_webhook_events").upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as never,
      processed_at: new Date().toISOString()
    },
    { onConflict: "stripe_event_id" }
  );
  if (error) {
    return NextResponse.json({ error: "Webhook persistence failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
