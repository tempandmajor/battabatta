-- Explicit table privileges. Newer Supabase images no longer auto-grant CRUD on
-- new tables to anon/authenticated, so every grant here is deliberate and
-- minimal: anon can only read public-facing tables; authenticated members get
-- exactly the verbs the app uses. RLS remains the row-level gate on top.

-- Public-facing reads (anonymous browsing)
grant select on public.profiles to anon, authenticated;
grant select on public.profile_interests to anon, authenticated;
grant select on public.follows to anon, authenticated;
grant select on public.post_photos to anon, authenticated;
-- posts: column-limited select was granted in 20260702180000 (exact location excluded)

-- Member writes
grant insert, update on public.profiles to authenticated;
grant select, insert, update on public.profile_private to authenticated;
grant insert, delete on public.profile_interests to authenticated;
grant insert, update, delete on public.posts to authenticated;
-- saved_posts/blocks/follows include update: the app writes them with upsert,
-- which Postgres executes as INSERT ... ON CONFLICT DO UPDATE.
grant select, insert, update, delete on public.saved_posts to authenticated;
grant select, insert on public.offers to authenticated;
grant select, insert on public.offer_events to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update, delete on public.thread_reads to authenticated;
grant insert, update, delete on public.follows to authenticated;
grant select, insert, update, delete on public.blocks to authenticated;
grant select, insert on public.reports to authenticated;
grant select, insert on public.legal_consents to authenticated;
grant insert, update, delete on public.post_photos to authenticated;
grant select on public.donations to authenticated;

-- stripe_webhook_events: service role only (no client grants).

-- Remove the misleading defaults that WERE auto-granted.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
