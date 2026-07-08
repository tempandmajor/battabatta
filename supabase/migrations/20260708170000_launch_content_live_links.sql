alter table public.launch_content_profiles
  add column if not exists published_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists published_at timestamptz;

alter table public.launch_content_posts
  add column if not exists published_post_id uuid references public.posts(id) on delete set null,
  add column if not exists published_at timestamptz;

create unique index if not exists launch_content_profiles_published_profile_id_key
  on public.launch_content_profiles (published_profile_id)
  where published_profile_id is not null;

create unique index if not exists launch_content_posts_published_post_id_key
  on public.launch_content_posts (published_post_id)
  where published_post_id is not null;
