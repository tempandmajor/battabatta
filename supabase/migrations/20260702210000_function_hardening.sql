-- Function-level hardening from the Supabase security advisors.

-- Pin the search_path on the trigger helper.
alter function public.set_updated_at() set search_path = public;

-- Functions get EXECUTE for PUBLIC by default; remove it where the function
-- is not meant to be an API. discover_posts intentionally stays callable by
-- anon: it is the public discovery endpoint and returns no private data.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.respond_to_offer(uuid, text, text) from public, anon;
revoke execute on function public.list_threads() from public, anon;

-- Hosted projects ship a platform helper in public; lock it down when present.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
