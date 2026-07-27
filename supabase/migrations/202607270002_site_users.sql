-- Distinct roster of everyone who has ever signed in to an external site's own
-- auth, reported via the /api/activity beacon. site_activity is a capped,
-- rolling event log (see 202607270001) so it cannot answer "who has an account
-- on this project" once old rows age out — this table can, indefinitely.
create table if not exists public.site_users (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  email text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  sign_in_count integer not null default 1,
  unique (site_id, email)
);

create index if not exists site_users_site_last_seen_idx on public.site_users (site_id, last_seen_at desc);

alter table public.site_users enable row level security;
-- Written only by the /api/activity beacon endpoint and read only by the dashboard, both service-role.

-- Called by the activity beacon on every 'signed_in' event so the roster stays
-- current without a read-then-write race between concurrent sign-ins.
create or replace function public.record_site_sign_in(p_site_id uuid, p_email text)
returns void language sql as $$
  insert into public.site_users (site_id, email, last_seen_at, sign_in_count)
  values (p_site_id, p_email, now(), 1)
  on conflict (site_id, email) do update
    set last_seen_at = now(), sign_in_count = public.site_users.sign_in_count + 1;
$$;
