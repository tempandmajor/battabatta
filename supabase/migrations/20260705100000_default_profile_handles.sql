-- Assign a unique handle at signup so every profile is reachable at
-- /profiles/<handle> immediately after account creation. Previously
-- handle stayed null until onboarding completed, so new members'
-- profile pages 404'd and their "View profile" link disappeared.
-- Members can still change their handle during onboarding and in
-- settings. Also backfills existing null-handle profiles.

-- Pure helper: derive a constraint-compliant base handle from an email
-- local-part. Mirrors the onboarding suggestion in app/onboarding and
-- profiles.handle's check (^[a-z0-9_]{3,32}$). Truncated to 24 chars to
-- leave room for a uniqueness suffix.
create or replace function public.derive_base_handle(email text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when char_length(s.sanitized) >= 3 then s.sanitized
    else rpad(coalesce(nullif(s.sanitized, ''), 'member'), 3, '0')
  end
  from (
    select left(
      regexp_replace(lower(split_part(coalesce(email, ''), '@', 1)), '[^a-z0-9_]', '_', 'g'),
      24
    ) as sanitized
  ) as s;
$$;

revoke execute on function public.derive_base_handle(text) from public, anon, authenticated;

-- Recreate the signup trigger to insert with a handle. Uniqueness is
-- race-safe: rather than check-then-insert, we insert and catch
-- unique_violation (the only other unique constraint, the id pk, is
-- absorbed by on conflict (id) do nothing, so a violation here is
-- necessarily a handle collision), retrying with a random suffix, then
-- a uuid-derived suffix. If everything collides we fall back to a null
-- handle so signup is never blocked. create or replace preserves the
-- execute revokes applied in 20260702210000_function_hardening.sql.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text := public.derive_base_handle(new.email);
  candidate text;
  attempt integer;
  inserted boolean := false;
begin
  for attempt in 0..6 loop
    candidate := case
      when attempt = 0 then base
      when attempt <= 5 then base || '_' || left(md5(random()::text || clock_timestamp()::text), 4)
      else 'member_' || left(replace(new.id::text, '-', ''), 12)
    end;
    begin
      insert into public.profiles (id, display_name, handle, is_adult_confirmed)
      values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'New member'),
        candidate,
        false
      )
      on conflict (id) do nothing;
      inserted := true;
      exit;
    exception when unique_violation then
      -- handle collision: try the next candidate
    end;
  end loop;

  if not inserted then
    insert into public.profiles (id, display_name, is_adult_confirmed)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'New member'),
      false
    )
    on conflict (id) do nothing;
  end if;

  insert into public.profile_private (profile_id, email)
  values (new.id, new.email)
  on conflict (profile_id) do update set email = excluded.email;

  return new;
end;
$$;

-- Backfill profiles created before this migration that have not yet
-- completed onboarding. Emails live in profile_private (written by the
-- trigger since the initial schema).
do $$
declare
  rec record;
  base text;
  candidate text;
  attempt integer;
  done boolean;
begin
  for rec in
    select p.id, pp.email
    from public.profiles p
    left join public.profile_private pp on pp.profile_id = p.id
    where p.handle is null
  loop
    base := public.derive_base_handle(rec.email);
    done := false;
    for attempt in 0..6 loop
      candidate := case
        when attempt = 0 then base
        when attempt <= 5 then base || '_' || left(md5(random()::text || clock_timestamp()::text), 4)
        else 'member_' || left(replace(rec.id::text, '-', ''), 12)
      end;
      begin
        update public.profiles set handle = candidate where id = rec.id;
        done := true;
        exit;
      exception when unique_violation then
        -- collision: try the next candidate
      end;
    end loop;
    if not done then
      raise warning 'default_profile_handles: could not backfill handle for profile %', rec.id;
    end if;
  end loop;
end;
$$;
