# Architecture

```text
Browser
  -> Next.js App Router (server components + server actions)
  -> middleware.ts refreshes Supabase sessions on every request
  -> Supabase Auth (email/password + optional GitHub OAuth, PKCE)
  -> Supabase Postgres: RLS on every table, PostGIS for distance, tsvector search
  -> Supabase Storage: public avatars / post-photos buckets, owner-folder write RLS
  -> Supabase Realtime: live thread messages (RLS-scoped postgres_changes)
  -> Stripe Checkout/Billing/Webhooks for OMS2 support payments only
```

## Key server-side pieces

- `discover_posts(...)` — security-definer RPC that computes distance from private
  coordinates and returns only bucketed labels ("1-5 mi"); filters scope, kind,
  category, radius, full-text search; excludes paused owners and blocked members.
- `respond_to_offer(...)` — security-definer RPC enforcing the offer state machine
  (pending → interested/countered/declined/withdrawn/closed_by_user), writing
  `offer_events`, and decrementing limited availability. The loose participant
  UPDATE policy on `offers` was dropped; status changes only flow through this RPC.
- `list_threads()` — security-invoker RPC returning the inbox (other participant,
  last message, unread counts from `thread_reads`).
- Column-level privileges revoke client SELECT on `posts.location`; exact
  coordinates live in `profile_private.exact_location` (owner-only RLS).

## Data Boundaries

- Public reads: active posts (minus exact location), public profiles, interests,
  follows, approximate location labels, post photos.
- Private reads: exact location, email, Stripe customer ID, saved posts, blocks,
  own donations, own legal consents, thread read markers.
- Participant reads: offer records, offer events, messages (blocks also gate
  message inserts at the RLS layer).
- Admin-only future surface: reports queue, moderation cases, audit logs.

## Payment Boundary

Stripe is used only for OMS2 platform support. The billing portal is only ever
opened for the authenticated member's own `stripe_customer_id`. Webhooks are
signature-verified, idempotent via `stripe_webhook_events`, and record donations
and subscription status. No user-to-user payments, Connect accounts, escrow,
settlement, barter valuation, or completed-exchange accounting may be added
without separate legal/tax review.
