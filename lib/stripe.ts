import Stripe from "stripe";

export const stripeApiVersion = "2026-02-25.clover" as const;

export function createStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(key, {
    apiVersion: stripeApiVersion as Stripe.StripeConfig["apiVersion"]
  });
}
