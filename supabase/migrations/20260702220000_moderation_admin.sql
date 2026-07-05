create type public.admin_role as enum ('admin', 'moderator');
create type public.account_moderation_status as enum ('active', 'suspended', 'blocked');
create type public.moderation_action_type as enum (
  'report_reviewing',
  'report_dismissed',
  'report_actioned',
  'post_hidden',
  'post_restored',
  'profile_suspended',
  'profile_unsuspended',
  'profile_blocked',
  'profile_unblocked'
);

create table public.admin_roles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  role public.admin_role not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.account_moderation (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  status public.account_moderation_status not null default 'active',
  reason text check (reason is null or char_length(reason) <= 500),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.moderation_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action public.moderation_action_type not null,
  report_id uuid references public.reports(id) on delete set null,
  target_profile_id uuid references public.profiles(id) on delete set null,
  target_post_id uuid references public.posts(id) on delete set null,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now()
);

create index account_moderation_status_idx on public.account_moderation (status);
create index moderation_audit_actor_created_idx on public.moderation_audit_log (actor_id, created_at desc);
create index moderation_audit_report_idx on public.moderation_audit_log (report_id);

alter table public.admin_roles enable row level security;
alter table public.account_moderation enable row level security;
alter table public.moderation_audit_log enable row level security;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_roles ar
    where ar.profile_id = auth.uid()
  );
$$;

grant execute on function public.current_user_is_admin to authenticated;

create policy "admins can read admin roles" on public.admin_roles
  for select using (public.current_user_is_admin());

create policy "admins can read account moderation" on public.account_moderation
  for select using (public.current_user_is_admin());

create policy "admins can read moderation audit log" on public.moderation_audit_log
  for select using (public.current_user_is_admin());

create or replace function public.is_profile_suspended(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.account_moderation am
    where am.profile_id = p_profile_id
      and am.status in ('suspended', 'blocked')
  );
$$;

grant execute on function public.is_profile_suspended to anon, authenticated;

drop policy "active posts readable" on public.posts;
create policy "active posts readable" on public.posts for select using (
  status = 'active'
  and (expires_at is null or expires_at > now())
  and not public.is_profile_suspended(owner_id)
);

drop function public.discover_posts(
  text,
  public.post_kind,
  public.post_category,
  text,
  double precision,
  integer,
  integer
);

create or replace function public.discover_posts(
  p_scope text default 'local',
  p_kind public.post_kind default null,
  p_category public.post_category default null,
  p_search text default null,
  p_radius_miles double precision default 10,
  p_limit integer default 60,
  p_offset integer default 0
)
returns table (
  id uuid,
  owner_id uuid,
  kind public.post_kind,
  category public.post_category,
  title text,
  body text,
  what_i_can_give text,
  location_mode public.location_mode,
  approximate_location_label text,
  approval_policy public.approval_policy,
  availability_total integer,
  availability_remaining integer,
  availability_unit text,
  created_at timestamptz,
  distance_bucket text,
  owner_display_name text,
  owner_handle text,
  owner_avatar_url text
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_origin extensions.geography;
begin
  if v_uid is not null then
    select pp.exact_location into v_origin
    from public.profile_private pp
    where pp.profile_id = v_uid;
  end if;

  return query
  select
    p.id,
    p.owner_id,
    p.kind,
    p.category,
    p.title,
    p.body,
    p.what_i_can_give,
    p.location_mode,
    p.approximate_location_label,
    p.approval_policy,
    p.availability_total,
    p.availability_remaining,
    p.availability_unit,
    p.created_at,
    case
      when v_origin is null or p.location is null then null
      when extensions.st_distance(p.location, v_origin) < 1609.34 then '<1 mi'
      when extensions.st_distance(p.location, v_origin) < 8046.7 then '1-5 mi'
      when extensions.st_distance(p.location, v_origin) < 16093.4 then '5-10 mi'
      else '10-25 mi'
    end,
    pr.display_name,
    pr.handle,
    pr.avatar_url
  from public.posts p
  join public.profiles pr on pr.id = p.owner_id
  where p.status = 'active'
    and (p.expires_at is null or p.expires_at > now())
    and not pr.is_paused
    and not public.is_profile_suspended(pr.id)
    and (p_kind is null or p.kind = p_kind)
    and (p_category is null or p.category = p_category)
    and (
      case
        when p_scope = 'online' then p.location_mode in ('online', 'local_and_online')
        else p.location_mode in ('local', 'local_and_online')
      end
    )
    and (
      p_scope <> 'local'
      or v_origin is null
      or p.location is null
      or extensions.st_dwithin(p.location, v_origin, p_radius_miles * 1609.34)
    )
    and (
      p_search is null
      or btrim(p_search) = ''
      or p.search_vector @@ websearch_to_tsquery('english', p_search)
    )
    and (
      v_uid is null
      or not exists (
        select 1 from public.blocks b
        where (b.blocker_id = v_uid and b.blocked_id = p.owner_id)
           or (b.blocker_id = p.owner_id and b.blocked_id = v_uid)
      )
    )
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
end;
$$;

grant execute on function public.discover_posts to anon, authenticated;

-- Table privileges. Like anon/authenticated (see 20260702200000_grants.sql),
-- service_role gets no automatic CRUD on tables in this Postgres image, and the
-- moderation/admin features run entirely through the service-role client.
grant select on public.admin_roles to authenticated;
grant select on public.account_moderation to authenticated;
grant select on public.moderation_audit_log to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
