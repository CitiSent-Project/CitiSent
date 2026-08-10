-- Keep reports.id as the immutable UUID primary key because it is referenced by
-- chat messages, notifications, and other records. report_number is the
-- user-facing identifier (for example: bfp-0001).
alter table public.reports
  add column if not exists report_number text;

create table if not exists public.report_number_sequences (
  agency_slug text primary key,
  last_number integer not null default 0,
  constraint report_number_sequences_last_number_check
    check (last_number between 0 and 9999)
);

alter table public.reports
  drop constraint if exists reports_report_number_key;

alter table public.reports
  add constraint reports_report_number_key unique (report_number);

create or replace function public.assign_report_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
  normalized_slug text := lower(trim(new.issue_type));
begin
  if new.report_number is not null then
    return new;
  end if;

  if normalized_slug = '' then
    raise exception 'A department slug is required to create a report';
  end if;

  insert into public.report_number_sequences (agency_slug, last_number)
  values (normalized_slug, 1)
  on conflict (agency_slug) do update
    set last_number = public.report_number_sequences.last_number + 1
  returning last_number into next_number;

  if next_number > 9999 then
    raise exception 'The report number limit for agency % has been reached', normalized_slug;
  end if;

  new.report_number := format('%s-%s', normalized_slug, lpad(next_number::text, 4, '0'));
  return new;
end;
$$;

drop trigger if exists reports_assign_report_number on public.reports;
create trigger reports_assign_report_number
before insert on public.reports
for each row execute function public.assign_report_number();

create index if not exists reports_report_number_idx
  on public.reports (report_number);
