alter type public.moderation_action_type add value if not exists 'post_ads_approved';
alter type public.moderation_action_type add value if not exists 'post_ads_limited';
alter type public.moderation_action_type add value if not exists 'post_ads_rejected';
alter type public.moderation_action_type add value if not exists 'post_ads_suppressed';

create type public.post_ad_moderation_status as enum (
  'pending_review',
  'approved',
  'limited_ads',
  'rejected',
  'reported'
);

create table public.post_ad_moderation (
  post_id uuid primary key references public.posts(id) on delete cascade,
  status public.post_ad_moderation_status not null default 'pending_review',
  automated_flags text[] not null default '{}',
  review_note text check (review_note is null or char_length(review_note) <= 1000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  last_scanned_at timestamptz not null default now(),
  ads_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index post_ad_moderation_status_idx on public.post_ad_moderation (status, updated_at desc);

alter table public.post_ad_moderation enable row level security;

create policy "admins can read post ad moderation" on public.post_ad_moderation
  for select using (public.current_user_is_admin());

grant select, insert, update, delete on public.post_ad_moderation to service_role;
grant select on public.post_ad_moderation to authenticated;
