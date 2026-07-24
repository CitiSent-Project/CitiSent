-- Create mapping table for agency staff/admin users
create table if not exists public.agency_staff_users (
  user_id uuid not null references auth.users(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,

  role text not null default 'agency_staff' check (role in ('agency_staff','admin')),

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  primary key (user_id, agency_id)
);

-- Chat messages
create table if not exists public.report_messages (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_report_messages_report_created_at
  on public.report_messages (report_id, created_at asc);

create index if not exists idx_report_messages_report_sender
  on public.report_messages (report_id, sender_id);

-- Per-user read state
create table if not exists public.report_message_reads (
  message_id uuid not null references public.report_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_read boolean not null default false,
  read_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (message_id, user_id)
);

create index if not exists idx_report_message_reads_user
  on public.report_message_reads (user_id, is_read, read_at desc);

create index if not exists idx_report_message_reads_message
  on public.report_message_reads (message_id);

-- Enable RLS
alter table public.agency_staff_users enable row level security;
alter table public.report_messages enable row level security;
alter table public.report_message_reads enable row level security;

-- Grants (RLS still controls row access)
grant select, insert, update, delete on public.agency_staff_users to authenticated;
grant select, insert, update, delete on public.report_messages to authenticated;
grant select, insert, update, delete on public.report_message_reads to authenticated;

grant usage on schema public to authenticated;

grant select on public.agency_staff_users to anon;

grant select on public.report_messages to anon;

-- =====================
-- RLS: helper expressions
-- A user can access a report if:
--   (a) they are the citizen: public.reports.user_id = auth.uid()
--   (b) OR they are staff/admin for the report's agency_id via agency_staff_users
-- =====================

-- agency_staff_users
-- Citizen shouldn't see other staff; staff can see rows for their own agency; keep it tight.
DROP POLICY IF EXISTS "staff own agency rows" ON public.agency_staff_users;

CREATE POLICY "staff own agency rows"
ON public.agency_staff_users
FOR SELECT TO authenticated
USING (
  agency_id IN (
    SELECT a.agency_id
    FROM public.agency_staff_users a
    WHERE a.user_id = auth.uid()
  )
);

-- Insert/Update/Delete of mapping: only allow admin users (derive from profiles.app_role = 'admin')
DROP POLICY IF EXISTS "admin manage staff mapping" ON public.agency_staff_users;

CREATE POLICY "admin manage staff mapping"
ON public.agency_staff_users
FOR ALL TO authenticated
USING (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.app_role = 'admin'
  )
)
WITH CHECK (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.app_role = 'admin'
  )
);

-- report_messages
-- Select: only participants (citizen or staff/admin for agency)
DROP POLICY IF EXISTS "participants read messages" ON public.report_messages;

CREATE POLICY "participants read messages"
ON public.report_messages
FOR SELECT TO authenticated
USING (
  exists (
    select 1
    from public.reports r
    where r.id = report_messages.report_id
      and (
        r.user_id = auth.uid()
        or exists (
          select 1 from public.agency_staff_users aus
          where aus.agency_id = r.agency_id
            and aus.user_id = auth.uid()
        )
      )
  )
);

-- Insert: sender must be a participant for that report
DROP POLICY IF EXISTS "participants insert messages" ON public.report_messages;

CREATE POLICY "participants insert messages"
ON public.report_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.reports r
    where r.id = report_messages.report_id
      and (
        r.user_id = auth.uid()
        or exists (
          select 1 from public.agency_staff_users aus
          where aus.agency_id = r.agency_id
            and aus.user_id = auth.uid()
        )
      )
  )
);

-- We generally don't want updates/deletes from clients; but if you want them, restrict to sender.
DROP POLICY IF EXISTS "sender update messages" ON public.report_messages;

CREATE POLICY "sender update messages"
ON public.report_messages
FOR UPDATE TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "sender delete messages" ON public.report_messages;

CREATE POLICY "sender delete messages"
ON public.report_messages
FOR DELETE TO authenticated
USING (sender_id = auth.uid());

-- report_message_reads
-- Select: only the user themself (and only if they can access the report)
DROP POLICY IF EXISTS "user read their read-state" ON public.report_message_reads;

CREATE POLICY "user read their read-state"
ON public.report_message_reads
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  and exists (
    select 1
    from public.report_messages m
    join public.reports r on r.id = m.report_id
    where m.id = report_message_reads.message_id
      and (
        r.user_id = auth.uid()
        or exists (
          select 1 from public.agency_staff_users aus
          where aus.agency_id = r.agency_id
            and aus.user_id = auth.uid()
        )
      )
  )
);

-- Insert/Update read-state: only for their own user_id
DROP POLICY IF EXISTS "user upsert read-state" ON public.report_message_reads;

CREATE POLICY "user upsert read-state"
ON public.report_message_reads
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  and exists (
    select 1
    from public.report_messages m
    join public.reports r on r.id = m.report_id
    where m.id = report_message_reads.message_id
      and (
        r.user_id = auth.uid()
        or exists (
          select 1 from public.agency_staff_users aus
          where aus.agency_id = r.agency_id
            and aus.user_id = auth.uid()
        )
      )
  )
);

DROP POLICY IF EXISTS "user update read-state" ON public.report_message_reads;

CREATE POLICY "user update read-state"
ON public.report_message_reads
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
