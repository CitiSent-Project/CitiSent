# CitiSent Backend

Express.js + Supabase backend scaffolded with clean architecture principles and secure defaults.

## Current Folder Structure

```text
backend/
  src/
    app.js
    server.js
    config/
      env.js
      logger.js
      supabase.js
    middlewares/
      auth.js
      errorHandler.js
      notFound.js
      requestContext.js
      validateRequest.js
    routes/
      index.js
    modules/
      health/
        health.controller.js
        health.route.js
      reports/
        reports.controller.js
        reports.mapper.js
        reports.repository.js
        reports.route.js
        reports.schema.js
        reports.service.js
    shared/
      errors/
        appError.js
      utils/
        asyncHandler.js
```

## Architectural Rules

- `routes`: endpoint composition only.
- `controller`: HTTP request/response mapping only.
- `service`: use-case and business logic.
- `repository`: Supabase queries and persistence logic.
- `schema`: request validation contracts with Zod.
- `middlewares`: cross-cutting concerns (auth, validation, errors, request context).
- `shared`: generic reusable utilities and error primitives.

## Scalable Target Structure (Recommended)

```text
backend/
  database/
    migrations/
    seeds/
  src/
    app.js
    server.js
    config/
      env.js
      logger.js
      supabase.js
    middlewares/
      auth.js
      errorHandler.js
      notFound.js
      requestContext.js
      validateRequest.js
    routes/
      index.js
    modules/
      <feature>/
        <feature>.controller.js
        <feature>.service.js
        <feature>.repository.js
        <feature>.route.js
        <feature>.schema.js
        <feature>.mapper.js
        README.md
    shared/
      errors/
        appError.js
      utils/
        asyncHandler.js
```

Use this as your baseline whenever you add new domains like `notifications`, `users`, `analytics`, and `sentiment`.

## Naming Conventions

- JavaScript files: `camelCase` (example: `requestContext.js`, `validateRequest.js`).
- React component files (`.jsx`): `PascalCase` (example: `ReportCard.jsx`).
- Feature module files: `<feature>.<layer>.js` for consistency (`reports.service.js`).
- Avoid duplicate config files; keep one source of truth per concern.

## Security Baseline

- `helmet` for secure headers.
- `cors` allowlist from environment config.
- `express-rate-limit` for abuse protection.
- `hpp` for HTTP parameter pollution prevention.
- JSON body size limit (`1mb`) to reduce payload abuse.
- Auth middleware validates Supabase JWT (`Bearer <token>`).

## Caching

- `GET /api/v1/reports` responses are cached by user + query filters (`limit`, `offset`, `status`).
- TTL is controlled by `CACHE_TTL_SECONDS` (default: `60`).
- `POST /api/v1/reports` invalidates the cached report-list entries for that user.
- Cache driver selection:
  - `CACHE_DRIVER=auto` (default): uses Redis if `REDIS_URL` is set, otherwise in-memory cache.
  - `CACHE_DRIVER=redis`: forces Redis usage (falls back to memory if Redis is unavailable).
  - `CACHE_DRIVER=memory`: uses in-memory cache only.

## Setup

1. Copy `.env.example` to `.env` and fill your Supabase values.
2. Install dependencies:
   - `npm install`
3. Start server:
   - `npm run dev`
4. Base URL:
   - `http://localhost:4000`

## API Endpoints

- `GET /` health banner
- `GET /api/v1/health` runtime health
- `GET /api/v1/health/supabase` Supabase connectivity and readiness health
- Auth:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/activate-account`
  - `GET /api/v1/auth/me` (authenticated)
  - `POST /api/v1/auth/logout`
- Users:
  - `GET /api/v1/users/me` (authenticated)
  - `PATCH /api/v1/users/me` (authenticated)
  - `DELETE /api/v1/users/me` (authenticated)
- Reports:
  - `GET /api/v1/reports` authenticated list of user reports
  - `POST /api/v1/reports` authenticated report creation
  - `GET /api/v1/reports/:reportId` authenticated report detail
  - `PATCH /api/v1/reports/:reportId` authenticated report update
  - `DELETE /api/v1/reports/:reportId` authenticated report delete

## Extending the Codebase

To add a new feature (example: notifications), create a new folder under `src/modules/notifications` with:

- `notifications.route.js`
- `notifications.controller.js`
- `notifications.service.js`
- `notifications.repository.js`
- `notifications.schema.js`

Then register it in `src/routes/index.js`.

## Account Invitations

Admin-created citizen accounts use secure setup links instead of temporary
passwords. Before using `POST /api/v1/admin/users`, run the migration in
`backend/database/migrations/20260526_secure_user_invitations.sql` and set:

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `INVITATION_JWT_SECRET` (32+ characters)
- `WEB_APP_BASE_URL` (for example `http://localhost:5173`)

## Database SQL code

-- CitiSent Production Schema (PostgreSQL / Supabase)
-- Run as a migration (single execution).

begin;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto; -- gen_random_uuid()
create extension if not exists citext;   -- case-insensitive text
create extension if not exists pg_trgm;  -- optional search acceleration

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum ('pending', 'in_review', 'resolved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'attachment_kind') then
    create type public.attachment_kind as enum ('image', 'video', 'document');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum ('status', 'report', 'account', 'alert', 'system');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Shared trigger function for updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Core user profile (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email         citext not null unique,
  username      citext not null unique
                check (username ~ '^[A-Za-z0-9_]+$' and char_length(username) between 3 and 40),
  phone_number  varchar(15) unique
                check (phone_number is null or phone_number ~ '^[0-9]{10,15}$'),
  age           smallint check (age is null or age between 1 and 120),
  gender        varchar(24),
  client_type   varchar(32),
  avatar_url    text,
  app_role      text not null default 'citizen'
                check (app_role in ('citizen', 'agency_staff', 'admin')),
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin user-management: banned users state
-- ---------------------------------------------------------------------------
create table if not exists public.banned_users (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  reason              text,
  is_active           boolean not null default true,
  banned_at           timestamptz not null default timezone('utc', now()),
  banned_by_user_id   uuid references auth.users(id) on delete set null,
  unbanned_at         timestamptz,
  unbanned_by_user_id uuid references auth.users(id) on delete set null,
  updated_at          timestamptz not null default timezone('utc', now()),
  constraint chk_banned_users_lifecycle
    check (
      (is_active = true and unbanned_at is null and unbanned_by_user_id is null) or
      (is_active = false and unbanned_at is not null)
    )
);

drop trigger if exists trg_banned_users_updated_at on public.banned_users;
create trigger trg_banned_users_updated_at
before update on public.banned_users
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Agencies and issue catalog (normalized lookup tables)
-- ---------------------------------------------------------------------------
create table if not exists public.agencies (
  id            uuid primary key default gen_random_uuid(),
  slug          citext not null unique,
  name          text not null unique,
  description   text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_agencies_updated_at on public.agencies;
create trigger trg_agencies_updated_at
before update on public.agencies
for each row execute function public.set_updated_at();

create table if not exists public.issue_types (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete restrict,
  code          citext not null unique,      -- stable app/internal key (e.g. bplo)
  name          text not null,               -- display label
  description   text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now()),
  unique (agency_id, name)
);

drop trigger if exists trg_issue_types_updated_at on public.issue_types;
create trigger trg_issue_types_updated_at
before update on public.issue_types
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reports (supports current API fields + normalized relationships)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,

  -- normalized references
  agency_id      uuid references public.agencies(id) on delete set null,
  issue_type_id  uuid references public.issue_types(id) on delete set null,

  -- compatibility with current backend contract
  issue_type     varchar(120) not null,
  description    text not null check (char_length(description) between 10 and 3000),
  location       varchar(240) not null,

  -- geo-ready (optional)
  latitude       numeric(9,6),
  longitude      numeric(9,6),
  constraint chk_reports_lat_lng_pair
    check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null)),
  constraint chk_reports_lat_range check (latitude is null or (latitude between -90 and 90)),
  constraint chk_reports_lng_range check (longitude is null or (longitude between -180 and 180)),

  sentiment_label varchar(32),
  status          public.report_status not null default 'pending',
  attachment_url  text, -- legacy single attachment field (kept for compatibility)
  submitted_at    timestamptz not null default timezone('utc', now()),
  resolved_at     timestamptz,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now()),

  -- FIX 1: Tightened resolved_at constraint — enforces both directions:
  --   pending/in_review must have resolved_at = null
  --   resolved/rejected must have resolved_at set
  -- (The trigger still sets resolved_at automatically on status change,
  --  but this constraint ensures correctness even if the trigger is bypassed.)
  constraint chk_reports_resolved_at
    check (
      (status not in ('resolved', 'rejected') and resolved_at is null) or
      (status in ('resolved', 'rejected') and resolved_at is not null)
    )
);

drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

-- Keep issue_type / agency_id aligned when issue_type_id is set.
create or replace function public.sync_report_issue_fields()
returns trigger
language plpgsql
as $$
declare
  v_issue_name text;
  v_agency_id uuid;
begin
  if new.issue_type_id is not null then
    select it.name, it.agency_id
      into v_issue_name, v_agency_id
    from public.issue_types it
    where it.id = new.issue_type_id;

    if v_issue_name is not null then
      new.issue_type := left(v_issue_name, 120);
      new.agency_id := v_agency_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reports_sync_issue_fields on public.reports;
create trigger trg_reports_sync_issue_fields
before insert or update of issue_type_id on public.reports
for each row execute function public.sync_report_issue_fields();

-- ---------------------------------------------------------------------------
-- Attachments (normalized one-to-many)
-- ---------------------------------------------------------------------------
create table if not exists public.report_attachments (
  id             uuid primary key default gen_random_uuid(),
  report_id      uuid not null references public.reports(id) on delete cascade,
  kind           public.attachment_kind not null default 'image',
  storage_bucket text,
  storage_path   text,
  mime_type      text,
  size_bytes     bigint check (size_bytes is null or size_bytes > 0),
  public_url     text,
  uploaded_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Status history (audit-friendly)
-- ---------------------------------------------------------------------------
-- FIX 2: Changed bigserial PK to uuid for consistency with all other tables.
create table if not exists public.report_status_history (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid not null references public.reports(id) on delete cascade,
  from_status   public.report_status,
  to_status     public.report_status not null,
  changed_by    uuid references auth.users(id) on delete set null,
  note          text,
  created_at    timestamptz not null default timezone('utc', now())
);

-- Auto-track report status changes.
create or replace function public.log_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.report_status_history (report_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status in ('resolved', 'rejected') and new.resolved_at is null then
      new.resolved_at := timezone('utc', now());
    end if;

    insert into public.report_status_history (report_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reports_status_history on public.reports;
create trigger trg_reports_status_history
before insert or update of status on public.reports
for each row execute function public.log_report_status_change();

-- ---------------------------------------------------------------------------
-- Comments and notifications
-- ---------------------------------------------------------------------------
create table if not exists public.report_comments (
  id             uuid primary key default gen_random_uuid(),
  report_id      uuid not null references public.reports(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body           text not null check (char_length(trim(body)) between 1 and 2000),
  is_internal    boolean not null default false,
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_report_comments_updated_at on public.report_comments;
create trigger trg_report_comments_updated_at
before update on public.report_comments
for each row execute function public.set_updated_at();

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          public.notification_type not null default 'system',
  title         varchar(140) not null,
  message       text not null,
  report_id     uuid references public.reports(id) on delete cascade,
  is_read       boolean not null default false,
  read_at       timestamptz,
  created_at    timestamptz not null default timezone('utc', now()),
  -- FIX 3: Tightened read constraint — is_read = true now requires read_at to be set.
  constraint chk_notifications_read_at
    check (
      (is_read = false and read_at is null) or
      (is_read = true  and read_at is not null)
    )
);

-- ---------------------------------------------------------------------------
-- Indexing strategy (query + scale)
-- ---------------------------------------------------------------------------
-- profiles
create index if not exists idx_profiles_app_role on public.profiles(app_role);
create index if not exists idx_banned_users_is_active on public.banned_users(is_active, banned_at desc);

-- issue catalog
create index if not exists idx_issue_types_agency_active on public.issue_types(agency_id, is_active);

-- reports: optimized for /reports?limit&offset&status ordered by created_at desc
create index if not exists idx_reports_user_created
  on public.reports(user_id, created_at desc, id desc);

create index if not exists idx_reports_user_status_created
  on public.reports(user_id, status, created_at desc, id desc);

create index if not exists idx_reports_status_created
  on public.reports(status, created_at desc);

create index if not exists idx_reports_issue_type_id
  on public.reports(issue_type_id);

create index if not exists idx_reports_agency_id
  on public.reports(agency_id);

-- Optional text search index
create index if not exists idx_reports_search_fts
  on public.reports
  using gin (to_tsvector('english', coalesce(issue_type,'') || ' ' || coalesce(description,'') || ' ' || coalesce(location,'')));

-- attachments/comments/history/notifications
create index if not exists idx_report_attachments_report_created
  on public.report_attachments(report_id, created_at desc);

create index if not exists idx_report_status_history_report_created
  on public.report_status_history(report_id, created_at desc);

create index if not exists idx_report_comments_report_created
  on public.report_comments(report_id, created_at desc);

create index if not exists idx_notifications_user_read_created
  on public.notifications(user_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- Security: RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.banned_users enable row level security;
alter table public.reports enable row level security;
alter table public.report_attachments enable row level security;
alter table public.report_status_history enable row level security;
alter table public.report_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.agencies enable row level security;
alter table public.issue_types enable row level security;

-- Profiles: users can manage only their own profile.
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = user_id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Agencies / issue types: read-only to authenticated users.
create policy agencies_read_all on public.agencies
  for select to authenticated using (true);

create policy issue_types_read_all on public.issue_types
  for select to authenticated using (true);

-- Reports: users can CRUD only their own reports.
create policy reports_select_own on public.reports
  for select using (auth.uid() = user_id);

create policy reports_insert_own on public.reports
  for insert with check (auth.uid() = user_id);

create policy reports_update_own on public.reports
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy reports_delete_own on public.reports
  for delete using (auth.uid() = user_id);

-- Attachments: access only if underlying report belongs to auth user.
create policy attachments_select_own_report on public.report_attachments
  for select using (
    exists (
      select 1 from public.reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

create policy attachments_insert_own_report on public.report_attachments
  for insert with check (
    exists (
      select 1 from public.reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

create policy attachments_delete_own_report on public.report_attachments
  for delete using (
    exists (
      select 1 from public.reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

-- Status history: visible to report owner.
create policy status_history_select_own_report on public.report_status_history
  for select using (
    exists (
      select 1 from public.reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

-- Comments: owner can read report comments; users can add comments to own reports.
create policy comments_select_own_report on public.report_comments
  for select using (
    exists (
      select 1 from public.reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

create policy comments_insert_own_report on public.report_comments
  for insert with check (
    exists (
      select 1 from public.reports r
      where r.id = report_id and r.user_id = auth.uid()
    ) and author_user_id = auth.uid()
  );

-- Notifications: per-user visibility/update.
create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);

create policy notifications_update_own on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- FIX 4: Elevated-role RLS policies for agency_staff and admin.
--
-- agency_staff can read all reports (to triage and action them),
-- and update report status/comments (but not delete citizen reports).
-- admin has full access to all tables.
--
-- These policies use the app_role stored in public.profiles, retrieved
-- via a helper function to avoid a subquery in every policy expression.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select app_role from public.profiles where user_id = auth.uid();
$$;

-- Banned users: read/write only for admins.
create policy banned_users_admin_read on public.banned_users
  for select using (public.current_user_role() = 'admin');

create policy banned_users_admin_write on public.banned_users
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Agencies: admin can insert/update/delete.
create policy agencies_admin_write on public.agencies
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Issue types: admin can insert/update/delete.
create policy issue_types_admin_write on public.issue_types
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Reports: agency_staff and admin can read all reports.
create policy reports_staff_select on public.reports
  for select using (public.current_user_role() in ('agency_staff', 'admin'));

-- Reports: agency_staff can update status/fields (not delete).
create policy reports_staff_update on public.reports
  for update using (public.current_user_role() in ('agency_staff', 'admin'))
  with check (public.current_user_role() in ('agency_staff', 'admin'));

-- Reports: admin can delete any report.
create policy reports_admin_delete on public.reports
  for delete using (public.current_user_role() = 'admin');

-- Attachments: staff/admin can read attachments on any report.
create policy attachments_staff_select on public.report_attachments
  for select using (public.current_user_role() in ('agency_staff', 'admin'));

-- Status history: staff/admin can read all history.
create policy status_history_staff_select on public.report_status_history
  for select using (public.current_user_role() in ('agency_staff', 'admin'));

-- Comments: staff/admin can read all comments (including internal ones).
create policy comments_staff_select on public.report_comments
  for select using (public.current_user_role() in ('agency_staff', 'admin'));

-- Comments: staff/admin can insert comments on any report.
create policy comments_staff_insert on public.report_comments
  for insert with check (
    public.current_user_role() in ('agency_staff', 'admin')
    and author_user_id = auth.uid()
  );

-- Notifications: admin can insert notifications for any user.
create policy notifications_admin_insert on public.notifications
  for insert with check (public.current_user_role() = 'admin');

-- Profiles: admin can read all profiles.
create policy profiles_staff_select on public.profiles
  for select using (public.current_user_role() in ('agency_staff', 'admin'));

-- ---------------------------------------------------------------------------
-- Bootstrap profile from auth.users
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, username, phone_number)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'phoneNumber', ''), '\D', '', 'g'), '')
  )
  on conflict (user_id) do update
  set email = excluded.email,
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists trg_auth_users_after_insert on auth.users;
create trigger trg_auth_users_after_insert
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Seed issue catalog (from current mobile issue list)
-- ---------------------------------------------------------------------------
insert into public.agencies (slug, name, description)
values
  ('bplo', 'Business Permits and Licensing Office (BPLO)', null),
  ('city-treasury', 'City Treasury Office', null),
  ('bfp-processing', 'Bureau of Fire Protection (BFP) Processing Area', null),
  ('traffic-management', 'City Traffic Management Division/Impounding Services', null),
  ('city-veterinary', 'City Veterinary Office', null),
  ('city-agriculture', 'City Agriculture Office', null),
  ('cooperative-development', 'City Cooperative Development Office', null),
  ('peso', 'Public Employment Service Office (PESO)', null),
  ('senior-pwd', 'Senior Citizens / PWD Accessibility Services', null)
on conflict (slug) do nothing;

insert into public.issue_types (agency_id, code, name, description)
select a.id, a.slug, a.name, null
from public.agencies a
on conflict (code) do nothing;

commit;
