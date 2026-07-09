-- Fix: public listing pages could not be server-rendered for logged-out
-- crawlers. `looking_for` was added in 20260708160000_launch_content_readiness
-- but was never added to the column-level SELECT grant established in
-- 20260702180000_production_hardening. As a result, getPublicPostDetail's
-- direct `select(... looking_for ...)` on public.posts failed with
-- "permission denied for table posts" (42501) for the anon/authenticated
-- roles, so the listing page returned notFound() and crawlers saw an empty
-- shell. The discover_posts RPC was unaffected because it is security definer.
--
-- `looking_for` is a public field (rendered as "What they want in exchange"),
-- so it belongs in the same public column grant as `what_i_can_give`. Precise
-- `location` and `search_vector` remain intentionally ungranted.

grant select (looking_for) on table public.posts to anon, authenticated;
