# Battarbox

Battarbox is an open-source, nonprofit-owned barter discovery app owned and maintained by OMS2.

The product helps adults publish what they can offer, describe what they are seeking, discover local or online opportunities, and negotiate non-binding exchanges. Battarbox does not process user-to-user payments, escrow, settlement, valuation, completion accounting, credits, or exchange ledgers.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth and PostgreSQL with PostGIS, RLS on every table, and migrations
- Supabase Storage for profile and post photos
- Supabase Realtime for live messaging
- Stripe Checkout and Billing for platform donations/supporter memberships only
- Resend for transactional emails and friend invites
- Optional Google AdSense in-feed ads, disabled by default
- Playwright, Vitest, ESLint, TypeScript checks

## Features

- Email/password auth with confirmation and password reset
- Onboarding with 18+ confirmation and versioned terms/privacy consent capture
- Profiles with photos, interests, follower counts, pause mode, and approximate-only public location
- Offering/seeking posts with photos, availability limits, and approval policies
- Discovery with local/online scope, category and kind filters, distance buckets (PostGIS), and full-text search
- Saved posts, offers with a validated negotiation state machine, threaded realtime messaging with unread counts
- Block and report tooling; blocks are enforced in the database, not just the UI
- Give-what-you-can donations and supporter memberships via Stripe Checkout, with webhook-driven records
- Friend invites by email, plus optional clearly labeled in-feed ads

## Local Development

Prereqs: Node 22+, Docker (for Supabase), Supabase CLI.

1. `npm install`
2. `npm run db:start` — starts Supabase on ports 56321-56324, prints the anon and service-role keys
3. `cp .env.example .env.local` and paste in the printed keys
4. `npm run db:reset` — applies migrations and seeds demo members (password `password123`: jordan@, sam@, maya@, dev@, rosa@example.com)
5. `npm run dev` and open `http://localhost:3000`

Local emails (confirmations, resets) land in Inbucket at `http://127.0.0.1:56324`. Supabase Studio: `http://127.0.0.1:56323`.

Stripe routes require `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_SUPPORTER_PRICE_ID`. Use `npm run stripe:listen` to forward local webhooks.

Invite emails require `RESEND_API_KEY`. AdSense placements require `NEXT_PUBLIC_ADS_ENABLED=true`,
`NEXT_PUBLIC_ADSENSE_CLIENT_ID`, and `NEXT_PUBLIC_ADSENSE_IN_FEED_SLOT_ID`; keep ads disabled until OMS2/legal/privacy
review and AdSense approval are complete. If serving EEA, UK, or Switzerland users, keep ads disabled until a
Google-certified CMP is live and `NEXT_PUBLIC_ADSENSE_CMP_READY=true`.

## Checks

```bash
npm run typecheck
npm run lint
npm run test        # unit (Vitest)
npm run test:e2e    # Playwright, requires db:start + db:reset + .env.local
```

## Open Source

Battarbox is open-source software licensed under the MIT License. See `LICENSE` for the full license text.

The Battarbox name, logos, icons, and brand assets are trademarks or reserved brand assets of OMS2 and are not licensed for unrelated products. Forks and modified distributions should use a clearly distinct name and visual identity unless OMS2 grants written permission.

Contributions are welcome under `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `GOVERNANCE.md`.

## Safety Boundaries

- Adults only: onboarding requires 18+ confirmation and terms/privacy acceptance (recorded with versions).
- Public location is approximate only: exact coordinates are stored privately, excluded from client-readable queries, and surfaced solely as bucketed distances ("1-5 mi") computed server-side.
- Offers are non-binding negotiation records with a validated state machine (pending → interested/countered/declined/withdrawn/closed). No settlement, valuation, or completion states exist.
- Availability limits decrement only when an offer is marked interested, and manual approval is the default.
- Payments support the platform only; the Stripe billing portal is only ever opened for the authenticated member's own customer record.
- Ads, when enabled, are clearly labeled `Advertisements` in-feed placements and never buy ranking for member posts.
- AI features are deferred until core moderation, privacy, and legal controls are stable.

## Compliance Notice

The in-app legal pages (`/legal/*`) are drafts published for transparency and carry a "pending counsel review" banner. OMS2 should obtain legal, tax, privacy, nonprofit, and Stripe review before unrestricted public usage.
