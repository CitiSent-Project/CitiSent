-- Profiles enhancements for admin RBAC
alter table if exists public.profiles
  add column if not exists full_name text,
  add column if not exists address text,
  add column if not exists role text,
  add column if not exists department_id text,
  add column if not exists department_label text,
  add column if not exists account_type text default 'citizen';

create index if not exists idx_profiles_account_type
  on public.profiles (account_type);

create index if not exists idx_profiles_role
  on public.profiles (role);

create table if not exists public.transfer_requests (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  admin_name text not null,
  current_department_id text not null,
  current_department_label text not null,
  requested_department_id text not null,
  requested_department_label text not null,
  reason text not null,
  status text not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_by_name text,
  review_notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transfer_requests_admin_user_id
  on public.transfer_requests (admin_user_id);

create index if not exists idx_transfer_requests_status
  on public.transfer_requests (status);
