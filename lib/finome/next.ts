// Finome for Next.js apps: the same two files (index.ts + next.ts) are copied
// into each Ottomind app as src/lib/finome/. Reporting never throws and is a
// no-op until FINOME_APP_ID and FINOME_SECRET are set.
//
//   proxy.ts:        const finomeClick = captureFinomeClick(request, response);
//                    if (user) finomeSignup(request, response, user, event);
//   Stripe webhook:  await finomePayment({ email, paymentId: invoice.id, amountCents: invoice.amount_paid, currency });
//                    await finomeRefund({ email, paymentId: invoice.id });
//                    await finomeSubscription({ email, status, plan, mrrCents });
//
// People are identified to Finome by a hash of their email, so signups (from
// the auth session) and payments (from Stripe) match without sharing raw
// addresses or app user ids.

import { Finome, hashEmail } from "./index";

/** Click id cookie, set from ?fnm= on any page a /go link lands on. */
export const FINOME_COOKIE = "finome_ref";
const CLICK = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Only accounts created this recently count as new signups from a link. */
const NEW_ACCOUNT_MS = 24 * 3600_000;
const ATTRIBUTION_DAYS = 60;

type CookieJar = {
  get(name: string): { value: string } | undefined;
};
type ResponseCookies = {
  set(name: string, value: string, options?: Record<string, unknown>): unknown;
  delete(name: string): unknown;
};
type RequestLike = { nextUrl: URL; cookies: CookieJar };
type ResponseLike = { cookies: ResponseCookies };
type WaitUntil = { waitUntil(promise: Promise<unknown>): void } | undefined;

let client: Finome | null | undefined;
function finome() {
  if (client === undefined) {
    const appId = process.env.FINOME_APP_ID?.trim();
    const secret = process.env.FINOME_SECRET?.trim();
    client = appId && secret ? new Finome({ appId, secret }) : null;
  }
  return client;
}

const userKey = async (email: string) => `e_${(await hashEmail(email)).slice(0, 40)}`;

async function report(what: string, send: (f: Finome) => Promise<unknown>) {
  const f = finome();
  if (!f) return;
  try {
    await send(f);
  } catch (err) {
    console.error(`[finome] ${what} not reported`, err instanceof Error ? err.message : err);
  }
}

/** Saves ?fnm=<click id> from a promoter's link in a first-party cookie. Returns the click id, if any. */
export function captureFinomeClick(request: RequestLike, response: ResponseLike): string | null {
  const fresh = request.nextUrl.searchParams.get("fnm")?.toLowerCase() ?? null;
  if (fresh && CLICK.test(fresh)) {
    response.cookies.set(FINOME_COOKIE, fresh, {
      path: "/", maxAge: ATTRIBUTION_DAYS * 86400, sameSite: "lax", httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
    });
    return fresh;
  }
  const saved = request.cookies.get(FINOME_COOKIE)?.value ?? null;
  return saved && CLICK.test(saved) ? saved : null;
}

/**
 * Call from the proxy once the session user is known. When a visitor who came
 * through a promoter's link has just created an account, reports the signup
 * (in the background) and clears the cookie. Older accounts only clear it.
 */
export function finomeSignup(
  request: RequestLike,
  response: ResponseLike,
  user: { email?: string | null; created_at?: string | null },
  event?: WaitUntil,
  click = request.cookies.get(FINOME_COOKIE)?.value ?? null,
) {
  if (!click || !CLICK.test(click)) return;
  response.cookies.delete(FINOME_COOKIE);
  const created = user.created_at ? Date.parse(user.created_at) : NaN;
  if (!user.email || !(Date.now() - created < NEW_ACCOUNT_MS)) return;
  const email = user.email;
  const task = report("signup", async (f) =>
    f.signup({ userId: await userKey(email), email, referral: click, occurredAt: new Date(created) }));
  if (event) event.waitUntil(task);
  else void task;
}

/** A successful subscription payment, in cents. */
export async function finomePayment(e: { email: string | null | undefined; paymentId: string; amountCents: number; currency?: string | null; occurredAt?: Date }) {
  const email = e.email;
  if (!email || e.amountCents <= 0) return;
  await report("payment", async (f) => f.payment({
    userId: await userKey(email), paymentId: e.paymentId, amountCents: e.amountCents,
    currency: e.currency ?? "usd", occurredAt: e.occurredAt,
  }));
}

/** A refund of an earlier payment (full when amountCents is omitted). */
export async function finomeRefund(e: { email: string | null | undefined; paymentId: string; amountCents?: number }) {
  const email = e.email;
  if (!email) return;
  await report("refund", async (f) => f.refund({ userId: await userKey(email), paymentId: e.paymentId, amountCents: e.amountCents }));
}

/** The subscription's current state (Stripe status names), for revenue figures in Ops. */
export async function finomeSubscription(e: { email: string | null | undefined; status: string; plan?: string | null; mrrCents?: number | null; occurredAt?: Date }) {
  const email = e.email;
  if (!email) return;
  await report("subscription", async (f) => f.subscription({
    userId: await userKey(email), status: e.status, plan: e.plan ?? undefined, mrrCents: e.mrrCents ?? undefined,
    occurredAt: e.occurredAt,
  }));
}

/** A Stripe subscription's monthly recurring revenue in cents (yearly and weekly prices normalized). */
export function stripeMrrCents(subscription: {
  items: { data: { quantity?: number | null; price?: { unit_amount?: number | null; recurring?: { interval?: string; interval_count?: number } | null } | null }[] };
}): number {
  const perMonth: Record<string, number> = { day: 30, week: 52 / 12, month: 1, year: 1 / 12 };
  let total = 0;
  for (const item of subscription.items.data) {
    const price = item.price;
    const interval = price?.recurring?.interval;
    if (!price?.unit_amount || !interval || !(interval in perMonth)) continue;
    total += (price.unit_amount * (item.quantity ?? 1) * perMonth[interval]) / (price.recurring?.interval_count || 1);
  }
  return Math.round(total);
}
