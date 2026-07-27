-- Manual access records for existing apps that have their own Supabase/Auth.
-- These are matched by the user's email, per site, and do not replace central Auth.
create table if not exists public.project_access (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  email text not null,
  plan text not null default 'manual',
  payment_status public.payment_state not null default 'incomplete',
  access_override public.access_override not null default 'automatic',
  external_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, email)
);

create index if not exists project_access_site_email_idx on public.project_access (site_id, lower(email));
alter table public.project_access enable row level security;

-- Only the dashboard server (service role) manages these records. No browser policy is added.
create trigger project_access_set_updated_at before update on public.project_access
  for each row execute function public.set_updated_at();
