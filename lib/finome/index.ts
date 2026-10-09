// Finome SDK: captures Finome referrals in the browser and reports signups,
// payments, refunds and subscription changes from the app's server.
// Zero dependencies; runs on Node 18+, Bun, Deno and edge runtimes (Web Crypto).
//
//   Browser (landing pages):  captureReferral();  …  getReferral()
//   Server:                   const finome = new Finome({ appId, secret });
//                             await finome.signup({ userId, email, referral });
//
// Requests are signed like Stripe webhooks:
//   Finome-App: <app id>
//   Finome-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, `${t}.${body}`)>

export const FINOME_ENDPOINT = "https://www.ottomind.dev/api/finome/v1/events";
const PARAM = "fnm";
const STORAGE_KEY = "finome_ref";
const CLICK = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
const encoder = new TextEncoder();

/** HMAC-SHA256 signature header for a request body. */
export async function signBody(secret: string, body: string, timestamp = Math.floor(Date.now() / 1000)): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${body}`));
  return `t=${timestamp},v1=${hex(mac)}`;
}

/** SHA-256 of the trimmed, lower-cased email, so raw addresses never leave the app. */
export async function hashEmail(email: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(email.trim().toLowerCase())));
}

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

/**
 * Call on page load. Saves ?fnm=<click id> (first-party cookie + localStorage)
 * for `days`, removes it from the address bar and returns it.
 */
export function captureReferral(options: { days?: number } = {}): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const fresh = url.searchParams.get(PARAM)?.toLowerCase() ?? null;
  if (fresh && CLICK.test(fresh)) {
    const days = options.days ?? 60;
    const expires = Date.now() + days * 86400_000;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: fresh, expires }));
    } catch { /* storage blocked: the cookie still works */ }
    document.cookie = `${STORAGE_KEY}=${fresh}; Max-Age=${days * 86400}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    url.searchParams.delete(PARAM);
    window.history.replaceState(window.history.state, "", url.toString());
    return fresh;
  }
  return getReferral();
}

/** The saved click id, to send with the signup (form field or request body). */
export function getReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as { id?: string; expires?: number } | null;
    if (saved?.id && CLICK.test(saved.id) && (saved.expires ?? 0) > Date.now()) return saved.id;
  } catch { /* fall through to the cookie */ }
  const cookie = document.cookie.split("; ").find((c) => c.startsWith(`${STORAGE_KEY}=`))?.slice(STORAGE_KEY.length + 1) ?? null;
  return cookie && CLICK.test(cookie) ? cookie : null;
}

/** Server-side: read the click id from a Cookie header (when the browser posts to your own server). */
export function referralFromCookieHeader(header: string | null | undefined): string | null {
  const v = header?.split(/;\s*/).find((c) => c.startsWith(`${STORAGE_KEY}=`))?.slice(STORAGE_KEY.length + 1) ?? null;
  return v && CLICK.test(v) ? v : null;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

export type FinomeResult =
  | "attributed" | "accepted" | "unattributed" | "duplicate" | "exists" | "ignored" | "stale" | "unknown_user" | "unknown_payment";

export class FinomeError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface FinomeOptions {
  appId: string;
  secret: string;
  endpoint?: string;
  /** Attempts per event on network errors, 429 and 5xx (default 3). */
  retries?: number;
  fetch?: typeof fetch;
}

type Common = { userId: string; occurredAt?: Date | string; eventId?: string };

export class Finome {
  private readonly options: FinomeOptions;
  private readonly endpoint: string;
  private readonly retries: number;
  private readonly fetcher: typeof fetch;

  constructor(options: FinomeOptions) {
    this.options = options;
    if (!options.appId || !options.secret) throw new Error("Finome needs an appId and a secret.");
    this.endpoint = options.endpoint ?? FINOME_ENDPOINT;
    this.retries = Math.max(1, options.retries ?? 3);
    this.fetcher = options.fetch ?? fetch;
  }

  /** A new account. `referral` is the click id from captureReferral()/getReferral(). */
  async signup(e: Common & { email?: string; referral?: string | null; stripeCustomerId?: string }) {
    return this.send({
      id: e.eventId ?? `signup:${e.userId}`, type: "signup", user_id: e.userId, fnm: e.referral ?? undefined,
      email_hash: e.email ? await hashEmail(e.email) : undefined, stripe_customer: e.stripeCustomerId, occurred_at: iso(e.occurredAt),
    });
  }

  /** A successful payment, in the smallest currency unit. Commissions are calculated on USD. */
  async payment(e: Common & { paymentId: string; amountCents: number; currency?: string }) {
    return this.send({
      id: e.eventId ?? `payment:${e.paymentId}`, type: "payment", user_id: e.userId, payment_id: e.paymentId,
      amount_cents: e.amountCents, currency: (e.currency ?? "usd").toLowerCase(), occurred_at: iso(e.occurredAt),
    });
  }

  /** A refund of an earlier payment (full when amountCents is omitted). Unpaid commissions are reduced. */
  async refund(e: Common & { paymentId: string; amountCents?: number }) {
    return this.send({
      id: e.eventId ?? `refund:${e.paymentId}:${e.amountCents ?? "full"}`, type: "refund", user_id: e.userId,
      payment_id: e.paymentId, amount_cents: e.amountCents, occurred_at: iso(e.occurredAt),
    });
  }

  /** The user's current subscription (status as in Stripe: active, trialing, past_due, canceled…). */
  async subscription(e: Common & { status: string; plan?: string; mrrCents?: number }) {
    const occurred = iso(e.occurredAt) ?? new Date().toISOString();
    return this.send({
      id: e.eventId ?? `subscription:${e.userId}:${occurred}`, type: "subscription", user_id: e.userId,
      status: e.status, plan: e.plan, mrr_cents: e.mrrCents, occurred_at: occurred,
    });
  }

  /** Sends one event; retries keep the same event id, so the event is applied once. */
  async send(event: Record<string, unknown>): Promise<{ result: FinomeResult; detail?: string | null }> {
    const body = JSON.stringify(event);
    let last: unknown;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      try {
        const res = await this.fetcher(this.endpoint, {
          method: "POST",
          headers: { "content-type": "application/json", "finome-app": this.options.appId, "finome-signature": await signBody(this.options.secret, body) },
          body,
        });
        const data = (await res.json().catch(() => ({}))) as { result?: FinomeResult; detail?: string; error?: string };
        if (res.status === 409) return { result: "duplicate", detail: data.detail };
        if (res.ok) return { result: data.result ?? "accepted", detail: data.detail };
        last = new FinomeError(data.error ?? `Finome returned ${res.status}`, res.status);
        if (res.status !== 429 && res.status < 500) throw last;
      } catch (err) {
        if (err instanceof FinomeError && err.status !== 429 && err.status < 500) throw err;
        last = err;
      }
    }
    throw last instanceof Error ? last : new Error("Finome request failed");
  }
}

function iso(v: Date | string | undefined) {
  if (v === undefined) return undefined;
  return (v instanceof Date ? v : new Date(v)).toISOString();
}
