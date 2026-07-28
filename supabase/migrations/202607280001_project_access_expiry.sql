-- Optional fixed-length access for manual project_access records (e.g. a 30-day
-- manual plan). Leave access_expires_at null for accounts with no expiry.
alter table public.project_access
  add column if not exists access_expires_at timestamptz;

create index if not exists project_access_expiry_idx on public.project_access (access_expires_at)
  where access_expires_at is not null;

-- Flips expired manual grants to 'paused'. Only touches rows still on 'automatic'
-- so an admin's manual pause/restore is never silently overwritten.
create or replace function public.pause_expired_project_access()
returns void language sql security definer set search_path = public as $$
  update public.project_access
  set access_override = 'paused'
  where access_override = 'automatic'
    and access_expires_at is not null
    and access_expires_at <= now();
$$;

create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('pause-expired-project-access');
exception when others then null;
end $$;

select cron.schedule(
  'pause-expired-project-access',
  '0 * * * *', -- hourly: keeps pauses timely without a tight polling loop
  $$select public.pause_expired_project_access();$$
);
