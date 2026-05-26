begin;

alter table public.profiles
  add column if not exists activation_status text not null default 'active',
  add column if not exists invitation_token_hash text,
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists invitation_activated_at timestamptz,
  add column if not exists invitation_created_by_user_id uuid references auth.users(id) on delete set null;

alter table public.profiles
  drop constraint if exists chk_profiles_activation_status;

alter table public.profiles
  add constraint chk_profiles_activation_status
  check (activation_status in ('pending', 'active'));

update public.profiles
set activation_status = 'active'
where activation_status is null;

create index if not exists idx_profiles_activation_status
  on public.profiles(activation_status, created_at desc);

alter table public.notifications
  add column if not exists metadata jsonb;

commit;
