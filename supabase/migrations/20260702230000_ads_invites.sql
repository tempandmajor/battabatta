create type public.invite_status as enum ('sent', 'accepted', 'expired', 'blocked');

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_email text not null check (char_length(invitee_email) <= 320),
  token_hash text not null unique,
  status public.invite_status not null default 'sent',
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invites_inviter_created_idx on public.invites (inviter_id, created_at desc);
create index invites_email_status_idx on public.invites (invitee_email, status);
create index invites_expires_idx on public.invites (expires_at);

alter table public.invites enable row level security;

create policy "users read own invites" on public.invites
  for select using (inviter_id = auth.uid());

grant select on public.invites to authenticated;

-- No insert policy or grant for authenticated: invites are created only through
-- the service-role client, which enforces the daily rate limit and token hashing.
-- A direct insert path would let members bypass both.

create trigger set_invites_updated_at before update on public.invites
  for each row execute function public.set_updated_at();
