import { NextResponse, type NextRequest } from "next/server";
import { getSiteUrl } from "@/lib/utils";
import { createStripeClient } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nonprofit } from "@/lib/nonprofit";
import { checkoutSchema } from "@/lib/validation";

// Best-effort per-instance rate limit; enough to blunt abuse of an
// unauthenticated endpoint without external infrastructure.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, { count: number; windowStart: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  const stripe = createStripeClient();
  const siteUrl = getSiteUrl();
  const isDonation = parsed.data.mode === "donation";
  const supporterPriceId = process.env.STRIPE_SUPPORTER_PRICE_ID;

  if (!isDonation && !supporterPriceId) {
    return NextResponse.json({ error: "Supporter price is not configured" }, { status: 500 });
  }

  // Attach the signed-in member so the webhook can link donations and
  // subscription status to their account. Anonymous donations stay allowed.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let customerId: string | undefined;
  if (user) {
    const { data: privateProfile } = await supabase
      .from("profile_private")
      .select("stripe_customer_id, email")
      .eq("profile_id", user.id)
      .single();
    customerId = privateProfile?.stripe_customer_id ?? undefined;

    // Recurring platform support needs a durable customer; create one on first use.
    if (!customerId && !isDonation) {
      const customer = await stripe.customers.create({
        email: privateProfile?.email ?? user.email ?? undefined,
        metadata: {
          battarbox_profile_id: user.id,
          nonprofit_name: nonprofit.publicName,
          nonprofit_ein: nonprofit.ein
        }
      });
      customerId = customer.id;
      await supabase
        .from("profile_private")
        .update({ stripe_customer_id: customerId })
        .eq("profile_id", user.id);
    }
  } else if (!isDonation) {
    return NextResponse.json({ error: "Sign in to become a supporter" }, { status: 401 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: isDonation ? "payment" : "subscription",
    success_url: `${siteUrl}/support?status=success`,
    cancel_url: `${siteUrl}/support?status=cancelled`,
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    customer: customerId,
    customer_email: customerId ? undefined : user?.email ?? undefined,
    client_reference_id: user?.id,
    subscription_data: isDonation
      ? undefined
      : {
          metadata: {
            product: "battarbox",
            revenue_type: "supporter",
            barter_settlement: "false",
            profile_id: user?.id ?? "",
            nonprofit_name: nonprofit.publicName,
            nonprofit_ein: nonprofit.ein
          }
        },
    line_items: isDonation
      ? [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: nonprofit.donationProductName,
                description: `Supports OMS2's operation of the free Battarbox community listing and messaging platform. This is not payment for a barter exchange, escrow, stored value, listing boost, or payment to another member.`
              },
              unit_amount: parsed.data.amount ?? 1000
            },
            quantity: 1
          }
        ]
      : [
          {
            price: supporterPriceId,
            quantity: 1
          }
        ],
    metadata: {
      product: "battarbox",
      revenue_type: parsed.data.mode,
      barter_settlement: "false",
      profile_id: user?.id ?? "",
      nonprofit_name: nonprofit.publicName,
      nonprofit_ein: nonprofit.ein,
      nonprofit_domain: nonprofit.domain
    }
  });

  return NextResponse.json({ url: session.url });
}
