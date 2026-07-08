alter table public.posts
  add column looking_for text check (looking_for is null or char_length(looking_for) <= 500);

drop function public.discover_posts(
  text,
  public.post_kind,
  public.post_category,
  text,
  double precision,
  integer,
  integer
);

drop index if exists public.posts_search_vector_idx;
alter table public.posts drop column search_vector;
alter table public.posts add column search_vector tsvector generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(body, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(what_i_can_give, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(looking_for, '')), 'C')
) stored;
create index posts_search_vector_idx on public.posts using gin (search_vector);

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
  looking_for text,
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
  owner_avatar_url text,
  owner_supporter_since timestamptz
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
    p.looking_for,
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
    pr.avatar_url,
    pr.supporter_since
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
      v_uid is null
      or not exists (
        select 1 from public.blocks b
        where (b.blocker_id = v_uid and b.blocked_id = p.owner_id)
           or (b.blocker_id = p.owner_id and b.blocked_id = v_uid)
      )
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
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
end;
$$;

grant execute on function public.discover_posts to anon, authenticated;

create type public.launch_content_status as enum (
  'staged',
  'approved_first_batch',
  'approved_later_batch',
  'needs_edits'
);

create table public.launch_content_profiles (
  id uuid primary key default gen_random_uuid(),
  source_index integer not null unique,
  display_name text not null check (char_length(display_name) between 2 and 80),
  suggested_handle text not null check (suggested_handle ~ '^[a-z0-9_]{3,32}$'),
  setup_email text not null unique check (char_length(setup_email) <= 320),
  public_role text not null check (char_length(public_role) between 2 and 120),
  bio text not null check (char_length(bio) <= 800),
  public_location_label text,
  location_mode public.location_mode not null default 'online',
  interests text[] not null default '{}',
  status public.launch_content_status not null default 'staged',
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.launch_content_posts (
  id uuid primary key default gen_random_uuid(),
  launch_profile_id uuid not null references public.launch_content_profiles(id) on delete cascade,
  source_post_number integer not null,
  title text not null check (char_length(title) between 4 and 140),
  kind public.post_kind not null default 'offering',
  category public.post_category not null default 'services',
  location_mode public.location_mode not null default 'online',
  body text not null check (char_length(body) between 10 and 2000),
  what_i_can_give text check (what_i_can_give is null or char_length(what_i_can_give) <= 500),
  looking_for text check (looking_for is null or char_length(looking_for) <= 500),
  availability_total integer check (availability_total is null or availability_total between 1 and 1000),
  availability_unit text check (availability_unit is null or char_length(availability_unit) between 2 and 80),
  approval_policy public.approval_policy not null default 'manual_approval',
  suggested_images text,
  batch integer not null default 1 check (batch in (1, 2)),
  status public.launch_content_status not null default 'staged',
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (launch_profile_id, source_post_number)
);

create index launch_content_posts_profile_idx on public.launch_content_posts (launch_profile_id, source_post_number);
create index launch_content_profiles_status_idx on public.launch_content_profiles (status);
create index launch_content_posts_status_idx on public.launch_content_posts (status);

alter table public.launch_content_profiles enable row level security;
alter table public.launch_content_posts enable row level security;

create trigger set_launch_content_profiles_updated_at before update on public.launch_content_profiles
  for each row execute function public.set_updated_at();
create trigger set_launch_content_posts_updated_at before update on public.launch_content_posts
  for each row execute function public.set_updated_at();
