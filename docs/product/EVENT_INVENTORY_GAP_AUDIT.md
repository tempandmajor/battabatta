# Event Inventory Gap Audit

Date: 2026-07-05

## Finding

The requested `admin/quborlyevents` event inventory is not present in this repository.

This workspace is a Next.js/Supabase app named Battarbox. Its documented product goal is barter discovery, not event management. The database schema contains profiles, posts, saved posts, offers, messages, blocks, reports, legal consents, Stripe webhook events, donations, and post photos. It does not contain an `events` table, an event-admin account model, or Quborly-specific routes.

## Evidence Checked

- `README.md` describes Battarbox as a nonprofit barter discovery app.
- `docs/product/PRD.md` lists barter workflows: profiles, offering/seeking posts, saved posts, offers, messages, block/report, and Stripe support donations.
- `supabase/migrations/20260702170000_initial_schema.sql` defines no event inventory table.
- `supabase/seed.sql` seeds demo barter users and posts, not events.
- Repository search for `quborly`, `event`, `events`, `conference`, `festival`, `competition`, and `american idol` found no event product surface. The only structural event usage is `offer_events`, an audit/history table for barter-offer status changes.

## What Cannot Be Verified Yet

- "Every event in the admin/quborlyevents account" cannot be assessed because the account and event records are not available in this workspace.
- Event realism cannot be fixed record by record without the current event titles, descriptions, venues, dates, capacities, pricing, organizers, and metrics.
- Business cases cannot be researched for every event without the inventory, target city/market, price model, costs, sponsors, and performance data.

## What Is Ready

- `docs/product/EVENT_ASSESSMENT_CRITERIA.md` defines the assessment rubric, business-case criteria, event-type criteria, realism standards, required fields, workflow, and research sources.
- `docs/product/event-assessment-rubric.json` makes the rubric machine-readable.
- `docs/product/event-inventory-template.csv` defines the minimum event export/import shape.
- `docs/product/EVENT_ASSESSMENT_RUNBOOK.md` defines the event-by-event assessment workflow.

## Data Needed To Continue

Provide one of the following:

- A database dump or CSV export of the Quborly event records.
- Supabase project connection details for the Quborly Events admin database.
- A local branch/repository that actually contains the Quborly Events app.
- Screenshots or exported JSON from the admin account if direct database access is unavailable.

Minimum fields needed per event:

- id
- title
- event type
- date/time/timezone
- venue and city
- organizer
- description
- speakers, hosts, entertainers, performers, artists, cast, judges, vendors, sponsors, or other credited participants
- capacity
- ticket price or pricing tiers
- age policy
- accessibility details
- lineup/speakers/judges/acts/schedule
- sponsor/vendor details
- current status
- attendance, revenue, conversion, satisfaction, or other performance metrics if available

## Recommended Next Implementation Step

Once the event inventory is available, add an admin assessment table or fields similar to:

```sql
create type public.event_category as enum (
  'conference',
  'concert',
  'circuit_party',
  'play',
  'competition',
  'festival',
  'workshop',
  'market',
  'fundraiser',
  'community',
  'other'
);

create type public.event_credit_role as enum (
  'speaker',
  'host',
  'mc',
  'moderator',
  'entertainer',
  'performer',
  'artist',
  'dj',
  'musician',
  'band',
  'cast',
  'director',
  'playwright',
  'producer',
  'judge',
  'coach',
  'vendor',
  'sponsor',
  'other'
);

alter table public.events
  add column if not exists category public.event_category not null default 'other';

create table public.event_credits (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  role public.event_credit_role not null,
  name text not null check (char_length(name) between 2 and 160),
  bio text check (bio is null or char_length(bio) <= 1200),
  url text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.event_assessments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  score integer not null check (score between 0 and 100),
  status text not null check (status in ('publish', 'fix', 'rebuild', 'archive', 'reject')),
  findings jsonb not null default '[]'::jsonb,
  business_case jsonb not null default '{}'::jsonb,
  assessed_at timestamptz not null default now()
);
```

Do not add this migration to the current Battarbox schema until an actual `events` table or Quborly event model is present.
