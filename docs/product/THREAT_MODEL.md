# Threat Model

## Assets

- User identity and auth sessions.
- Exact coordinates and private location metadata.
- Offer threads and messages.
- Reports and moderation cases.
- Stripe customer, platform support payment, and recurring support references.

## Primary Risks

- Exact location leakage through public APIs.
- RLS bypass exposing private profiles or messages.
- Blocked users sending offers or messages.
- Stripe webhook spoofing.
- Confusing platform support payments with payment for barter.
- Prohibited items or unsafe services.
- Abuse of reporting, messaging, or search.

## Controls

- RLS on every application table.
- Approximate public location labels and distance buckets.
- Server-side webhook signature verification and idempotent event storage.
- No Stripe Connect, escrow, credits, stored value, settlement, marketplace payouts, or exchange completion states.
- Rate limits on auth, posts, offers, messages, reports, and search.
- Moderation queue, audit logs, block enforcement, and takedown workflow.
