import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { nonprofit } from "@/lib/nonprofit";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type DonationReceipt = {
  id: string;
  amount_cents: number;
  currency: string;
  donor_email: string | null;
  donor_name: string | null;
  created_at: string;
  receipt_sent_at: string | null;
};

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

function dollars(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(amountCents / 100);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendContributionReceipt(supabase: AdminClient, donation: DonationReceipt) {
  // Stripe delivers webhooks at least once and the event log is written after
  // processing, so a retried event can reach here for an already-receipted
  // donation. Never send twice.
  if (donation.receipt_sent_at) return;
  if (!donation.donor_email) {
    await supabase
      .from("donations")
      .update({ receipt_error: "Missing donor email" })
      .eq("id", donation.id);
    return;
  }

  const amount = dollars(donation.amount_cents, donation.currency);
  const date = new Date(donation.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const donorName = donation.donor_name?.trim() || "Supporter";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111111">
      <h1 style="font-size:22px;margin:0 0 12px">Thank you for supporting Battarbox</h1>
      <p>${escapeHtml(nonprofit.publicName)} received your platform support payment of <strong>${amount}</strong> on ${date}.</p>
      <p><strong>Supporter:</strong> ${escapeHtml(donorName)}<br><strong>Organization:</strong> ${escapeHtml(nonprofit.publicName)}</p>
      <p>This payment supports platform operations only. It is not payment for a barter exchange, listing boost, escrow service, stored value, or payment to another member.</p>
      <p style="font-size:13px;color:#666666">Battarbox does not process member-to-member payments, escrow, settlement, valuation, completion accounting, credits, stored value, or marketplace payouts.</p>
    </div>
  `;

  try {
    const result = await sendEmail({
      to: donation.donor_email,
      subject: `Your ${nonprofit.publicName} support payment receipt`,
      html,
      text: `${nonprofit.publicName} received your platform support payment of ${amount} on ${date}. This payment supports Battarbox platform operations only. It is not payment for a barter exchange, listing boost, escrow service, stored value, or payment to another member.`
    });
    await supabase
      .from("donations")
      .update({
        receipt_sent_at: new Date().toISOString(),
        receipt_email_id: result?.id ?? null,
        receipt_error: null
      })
      .eq("id", donation.id);
  } catch (error) {
    await supabase
      .from("donations")
      .update({
        receipt_error: error instanceof Error ? error.message : "Receipt email failed"
      })
      .eq("id", donation.id);
  }
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
    const { data: donation } = await supabase.from("donations").upsert(
      {
        profile_id: profileId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
        stripe_customer_id: customerId ?? null,
        donor_email: session.customer_details?.email ?? session.customer_email ?? null,
        donor_name: session.customer_details?.name ?? null,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "usd"
      },
      { onConflict: "stripe_checkout_session_id" }
    ).select("id, amount_cents, currency, donor_email, donor_name, created_at, receipt_sent_at")
      .single();

    if (donation?.donor_email) {
      await sendContributionReceipt(supabase, donation);
    }
  }
}

async function handleSubscriptionChange(supabase: AdminClient, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const profileId = (subscription.metadata?.profile_id || (await profileIdForCustomer(supabase, customerId))) as string | null;
  if (!profileId) return;

  const status = SUBSCRIPTION_STATUSES.has(subscription.status) ? subscription.status : "none";
  await supabase
    .from("profile_private")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: status as never,
      subscription_current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      subscription_cancel_at_period_end: subscription.cancel_at_period_end,
      subscription_latest_invoice_id:
        typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : subscription.latest_invoice?.id ?? null
    })
    .eq("profile_id", profileId);

  if (status === "active" || status === "trialing") {
    // Set only when not already a supporter: routine subscription.updated
    // events (renewals, cancel toggles) must not reset the original date.
    await supabase
      .from("profiles")
      .update({ supporter_since: new Date().toISOString() })
      .eq("id", profileId)
      .is("supporter_since", null);
  } else {
    await supabase.from("profiles").update({ supporter_since: null }).eq("id", profileId);
  }
}

async function handleInvoicePaid(supabase: AdminClient, invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId || !invoice.subscription || invoice.amount_paid <= 0) return;

  const profileId = await profileIdForCustomer(supabase, customerId);
  const paymentIntentId =
    typeof invoice.payment_intent === "string" ? invoice.payment_intent : invoice.payment_intent?.id ?? null;

  const { data: donation } = await supabase
    .from("donations")
    .upsert(
      {
        profile_id: profileId,
        stripe_customer_id: customerId,
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: paymentIntentId,
        donor_email: invoice.customer_email ?? null,
        donor_name: invoice.customer_name ?? null,
        amount_cents: invoice.amount_paid,
        currency: invoice.currency ?? "usd"
      },
      { onConflict: "stripe_invoice_id" }
    )
    .select("id, amount_cents, currency, donor_email, donor_name, created_at, receipt_sent_at")
    .single();

  await supabase
    .from("profile_private")
    .update({
      subscription_last_payment_status: invoice.status,
      subscription_latest_invoice_id: invoice.id
    })
    .eq("stripe_customer_id", customerId);

  if (donation?.donor_email) {
    await sendContributionReceipt(supabase, donation);
  }
}

async function handleInvoicePaymentFailed(supabase: AdminClient, invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  await supabase
    .from("profile_private")
    .update({
      subscription_last_payment_status: invoice.status,
      subscription_latest_invoice_id: invoice.id
    })
    .eq("stripe_customer_id", customerId);
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
            .update({
              subscription_status: "canceled",
              subscription_cancel_at_period_end: false,
              subscription_current_period_end: null
            })
            .eq("profile_id", profileId);
          await supabase.from("profiles").update({ supporter_since: null }).eq("id", profileId);
        }
        break;
      }
      case "invoice.paid":
        await handleInvoicePaid(supabase, event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, event.data.object);
        break;
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
