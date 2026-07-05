import Stripe from "stripe";

export function createStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  // No apiVersion override: the SDK pins the version its types were generated
  // for. Overriding to a newer version changes response shapes at runtime
  // (e.g. basil+ removed Subscription.current_period_end and
  // Invoice.subscription) without any type error.
  return new Stripe(key);
}
