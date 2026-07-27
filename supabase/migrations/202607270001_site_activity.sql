-- Privacy-conscious activity tracking for the portfolio dashboard.
-- tracking_key identifies a site to the public browser beacon; it is not a secret.
alter table public.sites
  add column if not exists tracking_key uuid not null default gen_random_uuid() unique;

create table if not exists public.site_activity (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  event_type text not null check (event_type in ('page_view', 'signed_in', 'feature_use')),
  anonymous_id text,
  user_email text,
  path text,
  created_at timestamptz not null default now(),
  check (anonymous_id is null or length(anonymous_id) <= 128),
  check (user_email is null or length(user_email) <= 320),
  check (path is null or length(path) <= 500)
);

create index if not exists site_activity_recent_idx on public.site_activity (created_at desc);
create index if not exists site_activity_site_recent_idx on public.site_activity (site_id, created_at desc);

alter table public.site_activity enable row level security;
-- Events are written only through the dashboard's server endpoint using the service role.
