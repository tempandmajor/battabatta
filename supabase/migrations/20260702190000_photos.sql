-- Profile photos (avatars) and post photos via Supabase Storage.
-- Buckets are public-read; writes are restricted to the owner's folder
-- (object paths are always "<user_id>/<filename>").

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-photos', 'post-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "users upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users upload own post photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own post photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own post photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Photo metadata for posts (up to a handful per post, ordered).

create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  path text not null,
  position integer not null default 0 check (position between 0 and 9),
  created_at timestamptz not null default now()
);

create index post_photos_post_id_idx on public.post_photos (post_id, position);

alter table public.post_photos enable row level security;

create policy "photos of readable posts are readable" on public.post_photos
  for select using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and (p.status = 'active' and (p.expires_at is null or p.expires_at > now()) or p.owner_id = auth.uid())
    )
  );
create policy "owners manage own post photos" on public.post_photos
  for all using (
    exists (select 1 from public.posts p where p.id = post_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.posts p where p.id = post_id and p.owner_id = auth.uid())
  );

-- Include the cover photo in discovery results.

drop function if exists public.discover_posts;

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
  owner_avatar_url text,
  cover_photo_path text
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
    pr.avatar_url,
    cover.path
  from public.posts p
  join public.profiles pr on pr.id = p.owner_id
  left join lateral (
    select ph.path from public.post_photos ph
    where ph.post_id = p.id
    order by ph.position asc, ph.created_at asc
    limit 1
  ) cover on true
  where p.status = 'active'
    and (p.expires_at is null or p.expires_at > now())
    and not pr.is_paused
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
