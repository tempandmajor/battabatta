-- Production hardening: location privacy, offer state machine, unread tracking,
-- block enforcement in messaging, updated_at triggers, realtime for messages.

-- 1. updated_at triggers -----------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_profile_private_updated_at before update on public.profile_private
  for each row execute function public.set_updated_at();
create trigger set_posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
create trigger set_offers_updated_at before update on public.offers
  for each row execute function public.set_updated_at();

-- 2. Location privacy --------------------------------------------------------
-- The exact post coordinates must never be readable by clients. Distance is
-- exposed only as bucketed labels through the discover_posts RPC below.

revoke select on table public.posts from anon, authenticated;
grant select (
  id, owner_id, kind, category, title, body, what_i_can_give,
  location_mode, approximate_location_label, approval_policy,
  availability_total, availability_remaining, availability_unit,
  status, expires_at, created_at, updated_at
) on table public.posts to anon, authenticated;

-- 3. Discovery RPC -----------------------------------------------------------
-- Security definer so it can compute distance from private coordinates without
-- ever returning them. Returns bucketed distance labels only.

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
  owner_handle text
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
    pr.handle
  from public.posts p
  join public.profiles pr on pr.id = p.owner_id
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

-- 4. Offer state machine -----------------------------------------------------
-- Offers become immutable records whose status changes only through this RPC,
-- which validates the actor and transition and writes an offer_events row.

drop policy "offer participants update offers" on public.offers;

create or replace function public.respond_to_offer(
  p_offer_id uuid,
  p_action text,
  p_note text default null
)
returns public.offers
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_offer public.offers;
  v_new public.offer_status;
  v_is_requester boolean;
  v_remaining integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    raise exception 'Offer not found';
  end if;

  if v_uid <> v_offer.requester_id and v_uid <> v_offer.recipient_id then
    raise exception 'Not a participant in this offer';
  end if;

  v_is_requester := v_uid = v_offer.requester_id;

  if p_action = 'interested' then
    v_new := 'interested';
    if not (
      (not v_is_requester and v_offer.status = 'pending')
      or (v_is_requester and v_offer.status = 'countered')
    ) then
      raise exception 'Cannot mark this offer as interested';
    end if;
  elsif p_action = 'countered' then
    v_new := 'countered';
    if not (not v_is_requester and v_offer.status = 'pending') then
      raise exception 'Cannot counter this offer';
    end if;
  elsif p_action = 'declined' then
    v_new := 'declined';
    if not (
      (not v_is_requester and v_offer.status in ('pending', 'countered'))
      or (v_is_requester and v_offer.status = 'countered')
    ) then
      raise exception 'Cannot decline this offer';
    end if;
  elsif p_action = 'withdrawn' then
    v_new := 'withdrawn';
    if not (v_is_requester and v_offer.status in ('pending', 'countered')) then
      raise exception 'Cannot withdraw this offer';
    end if;
  elsif p_action = 'closed' then
    v_new := 'closed_by_user';
    if v_offer.status <> 'interested' then
      raise exception 'Only interested offers can be closed';
    end if;
  else
    raise exception 'Unknown offer action: %', p_action;
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = v_offer.requester_id and b.blocked_id = v_offer.recipient_id)
       or (b.blocker_id = v_offer.recipient_id and b.blocked_id = v_offer.requester_id)
  ) then
    raise exception 'This conversation is unavailable';
  end if;

  if v_new = 'interested' and v_offer.post_id is not null then
    select availability_remaining into v_remaining
    from public.posts where id = v_offer.post_id for update;

    if v_remaining is not null then
      if v_remaining <= 0 then
        raise exception 'No availability remaining on this post';
      end if;
      update public.posts
        set availability_remaining = availability_remaining - 1
        where id = v_offer.post_id;
    end if;
  end if;

  insert into public.offer_events (offer_id, actor_id, from_status, to_status, note)
  values (p_offer_id, v_uid, v_offer.status, v_new, nullif(btrim(coalesce(p_note, '')), ''));

  update public.offers set status = v_new where id = p_offer_id
  returning * into v_offer;

  return v_offer;
end;
$$;

grant execute on function public.respond_to_offer to authenticated;

-- 5. Unread tracking ---------------------------------------------------------

create table public.thread_reads (
  offer_id uuid not null references public.offers(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (offer_id, profile_id)
);

alter table public.thread_reads enable row level security;

create policy "users manage own thread reads" on public.thread_reads
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Thread list with the other participant, last message, and unread count.
-- Security invoker: offer/message RLS still applies.
create or replace function public.list_threads()
returns table (
  offer_id uuid,
  other_id uuid,
  other_display_name text,
  other_handle text,
  offered_item text,
  requested_item text,
  timing text,
  status public.offer_status,
  is_requester boolean,
  post_id uuid,
  last_message_body text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    o.id,
    pr.id,
    pr.display_name,
    pr.handle,
    o.offered_item,
    o.requested_item,
    o.timing,
    o.status,
    o.requester_id = auth.uid(),
    o.post_id,
    lm.body,
    lm.created_at,
    lm.sender_id,
    uc.unread_count,
    o.created_at
  from public.offers o
  join public.profiles pr
    on pr.id = case when o.requester_id = auth.uid() then o.recipient_id else o.requester_id end
  left join lateral (
    select m.body, m.created_at, m.sender_id
    from public.messages m
    where m.offer_id = o.id and m.deleted_at is null
    order by m.created_at desc
    limit 1
  ) lm on true
  left join public.thread_reads tr
    on tr.offer_id = o.id and tr.profile_id = auth.uid()
  cross join lateral (
    select count(*) as unread_count
    from public.messages m2
    where m2.offer_id = o.id
      and m2.deleted_at is null
      and m2.sender_id <> auth.uid()
      and m2.created_at > coalesce(tr.last_read_at, 'epoch'::timestamptz)
  ) uc
  where o.requester_id = auth.uid() or o.recipient_id = auth.uid()
  order by coalesce(lm.created_at, o.created_at) desc;
$$;

grant execute on function public.list_threads to authenticated;

-- 6. Block enforcement in messaging ------------------------------------------

drop policy "offer participants send messages" on public.messages;
create policy "offer participants send messages" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.offers o
      where o.id = offer_id
        and (o.requester_id = auth.uid() or o.recipient_id = auth.uid())
        and not exists (
          select 1 from public.blocks b
          where (b.blocker_id = o.requester_id and b.blocked_id = o.recipient_id)
             or (b.blocker_id = o.recipient_id and b.blocked_id = o.requester_id)
        )
    )
  );

-- 7. Realtime for messages ----------------------------------------------------

alter publication supabase_realtime add table public.messages;

-- 8. Follows -------------------------------------------------------------------
-- Per the UX design: public follower/following counts and a follow button.
-- Deliberately no "exchanges" count: completed-exchange accounting is a
-- documented non-goal (PRD, threat model).

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint no_self_follow check (follower_id <> followee_id)
);

create index follows_followee_id_idx on public.follows (followee_id);

alter table public.follows enable row level security;

create policy "follows are readable" on public.follows for select using (true);
create policy "users create own follows" on public.follows
  for insert with check (
    follower_id = auth.uid()
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = followee_id and b.blocked_id = auth.uid())
         or (b.blocker_id = auth.uid() and b.blocked_id = followee_id)
    )
  );
create policy "users delete own follows" on public.follows
  for delete using (follower_id = auth.uid());
