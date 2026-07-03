import { NextResponse } from "next/server";
import { createStripeClient } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils";

// The billing-portal customer is always derived from the authenticated user's
// own record — never from the request body.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to manage billing" }, { status: 401 });
  }

  const { data: privateProfile } = await supabase
    .from("profile_private")
    .select("stripe_customer_id")
    .eq("profile_id", user.id)
    .single();
  if (!privateProfile?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing history found for your account" }, { status: 404 });
  }

  const stripe = createStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: privateProfile.stripe_customer_id,
    return_url: `${getSiteUrl()}/settings`
  });

  return NextResponse.json({ url: session.url });
}
