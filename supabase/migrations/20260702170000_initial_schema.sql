create extension if not exists postgis with schema extensions;
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.post_kind as enum ('offering', 'seeking');
create type public.post_category as enum ('goods', 'services');
create type public.location_mode as enum ('local', 'online', 'local_and_online');
create type public.post_status as enum ('draft', 'active', 'paused', 'expired', 'hidden', 'deleted');
create type public.approval_policy as enum ('auto_accept_until_limit', 'manual_approval');
create type public.offer_status as enum ('pending', 'interested', 'countered', 'declined', 'withdrawn', 'blocked', 'closed_by_user');
create type public.report_status as enum ('open', 'reviewing', 'actioned', 'dismissed');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid', 'none');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  handle text unique check (handle ~ '^[a-z0-9_]{3,32}$'),
  bio text not null default '' check (char_length(bio) <= 800),
  avatar_url text,
  public_location_label text,
  location_mode public.location_mode not null default 'local_and_online',
  is_paused boolean not null default false,
  is_adult_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_private (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  exact_location extensions.geography(point, 4326),
  locality text,
  region text,
  country_code text,
  email text,
  stripe_customer_id text unique,
  subscription_status public.subscription_status not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (char_length(label) between 2 and 80),
  primary key (profile_id, label)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind public.post_kind not null,
  category public.post_category not null,
  title text not null check (char_length(title) between 4 and 140),
  body text not null check (char_length(body) between 10 and 2000),
  what_i_can_give text check (char_length(what_i_can_give) <= 500),
  location_mode public.location_mode not null default 'local',
  approximate_location_label text,
  location extensions.geography(point, 4326),
  approval_policy public.approval_policy not null default 'manual_approval',
  availability_total integer check (availability_total is null or availability_total between 1 and 1000),
  availability_remaining integer check (availability_remaining is null or availability_remaining between 0 and 1000),
  availability_unit text check (availability_unit is null or char_length(availability_unit) between 2 and 80),
  status public.post_status not null default 'active',
  expires_at timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(what_i_can_give, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_remaining_lte_total check (
    availability_total is null or availability_remaining is null or availability_remaining <= availability_total
  )
);

create table public.saved_posts (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, post_id)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete set null,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  offered_item text not null check (char_length(offered_item) between 2 and 240),
  requested_item text not null check (char_length(requested_item) between 2 and 240),
  timing text check (char_length(timing) <= 240),
  note text check (char_length(note) <= 2000),
  status public.offer_status not null default 'pending',
  requires_approval boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_offer check (requester_id <> recipient_id)
);

create table public.offer_events (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  from_status public.offer_status,
  to_status public.offer_status not null,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  reported_profile_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  reason text not null check (char_length(reason) between 4 and 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.legal_consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  document_key text not null,
  document_version text not null,
  accepted_at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);

create table public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  created_at timestamptz not null default now()
);

create index profiles_handle_idx on public.profiles (handle);
create index posts_owner_id_idx on public.posts (owner_id);
create index posts_status_expires_idx on public.posts (status, expires_at);
create index posts_kind_category_idx on public.posts (kind, category);
create index posts_location_idx on public.posts using gist (location);
create index posts_search_vector_idx on public.posts using gin (search_vector);
create index offers_requester_id_idx on public.offers (requester_id);
create index offers_recipient_id_idx on public.offers (recipient_id);
create index offers_post_id_idx on public.offers (post_id);
create index messages_offer_id_created_at_idx on public.messages (offer_id, created_at);
create index reports_status_created_at_idx on public.reports (status, created_at);

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.profile_interests enable row level security;
alter table public.posts enable row level security;
alter table public.saved_posts enable row level security;
alter table public.offers enable row level security;
alter table public.offer_events enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.legal_consents enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.donations enable row level security;

create policy "public profiles are readable" on public.profiles for select using (true);
create policy "users insert own profile" on public.profiles for insert with check (id = auth.uid());
create policy "users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "users read own private profile" on public.profile_private for select using (profile_id = auth.uid());
create policy "users manage own private profile" on public.profile_private for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "profile interests readable" on public.profile_interests for select using (true);
create policy "users manage own interests" on public.profile_interests for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "active posts readable" on public.posts for select using (
  status = 'active' and (expires_at is null or expires_at > now())
);
create policy "users manage own posts" on public.posts for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "users manage own saved posts" on public.saved_posts for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "offer participants read offers" on public.offers for select using (
  requester_id = auth.uid() or recipient_id = auth.uid()
);
create policy "authenticated users create offers" on public.offers for insert with check (
  requester_id = auth.uid()
  and not exists (
    select 1 from public.blocks b
    where (b.blocker_id = recipient_id and b.blocked_id = auth.uid())
       or (b.blocker_id = auth.uid() and b.blocked_id = recipient_id)
  )
);
create policy "offer participants update offers" on public.offers for update using (
  requester_id = auth.uid() or recipient_id = auth.uid()
) with check (
  requester_id = auth.uid() or recipient_id = auth.uid()
);

create policy "offer participants read events" on public.offer_events for select using (
  exists (
    select 1 from public.offers o
    where o.id = offer_id and (o.requester_id = auth.uid() or o.recipient_id = auth.uid())
  )
);
create policy "offer participants add events" on public.offer_events for insert with check (
  actor_id = auth.uid()
  and exists (
    select 1 from public.offers o
    where o.id = offer_id and (o.requester_id = auth.uid() or o.recipient_id = auth.uid())
  )
);

create policy "offer participants read messages" on public.messages for select using (
  exists (
    select 1 from public.offers o
    where o.id = offer_id and (o.requester_id = auth.uid() or o.recipient_id = auth.uid())
  )
);
create policy "offer participants send messages" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.offers o
    where o.id = offer_id and (o.requester_id = auth.uid() or o.recipient_id = auth.uid())
  )
);

create policy "users manage own blocks" on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy "users create reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "users read own reports" on public.reports for select using (reporter_id = auth.uid());

create policy "users read own legal consents" on public.legal_consents for select using (profile_id = auth.uid());
create policy "users create own legal consents" on public.legal_consents for insert with check (profile_id = auth.uid());

create policy "users read own donations" on public.donations for select using (profile_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, is_adult_confirmed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'New member'),
    false
  )
  on conflict (id) do nothing;

  insert into public.profile_private (profile_id, email)
  values (new.id, new.email)
  on conflict (profile_id) do update set email = excluded.email;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
