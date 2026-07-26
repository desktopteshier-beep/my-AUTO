create extension if not exists "pgcrypto";

create type public.deploy_target as enum ('vercel', 'aws_lambda', 'aws_ecs');
create type public.iac_tool as enum ('cdk', 'terraform');
create type public.payment_state as enum ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  domain text not null unique,
  created_at timestamptz not null default now()
);
-- Registry driving every deployment and monitoring adapter.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  github_owner text not null,
  github_repo text not null,
  github_workflow text,
  deploy_target public.deploy_target not null,
  iac_tool public.iac_tool,
  vercel_project_id text,
  aws_region text,
  monitoring_provider text check (monitoring_provider = 'better_uptime'),
  monitoring_check_id text,
  monitoring_endpoint text not null,
  sentry_project_slug text,
  created_at timestamptz not null default now(),
  unique (github_owner, github_repo),
  check ((deploy_target = 'vercel' and iac_tool is null) or (deploy_target <> 'vercel' and iac_tool is not null))
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  plan text not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  payment_status public.payment_state not null default 'incomplete',
  renewal_date timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, site_id)
);
create index subscriptions_user_site_idx on public.subscriptions(user_id, site_id);
create index projects_site_idx on public.projects(site_id);
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

-- Profile rows are created only from the canonical shared Auth identity.
create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.users (auth_id, email) values (new.id, coalesce(new.email, '')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.sites enable row level security;
alter table public.projects enable row level security;
alter table public.subscriptions enable row level security;
-- Browser clients see only their own profile and entitlements. Billing mutations are server-only.
create policy "users_read_self" on public.users for select to authenticated using (auth_id = auth.uid());
create policy "sites_read_for_entitlement" on public.sites for select to authenticated using (exists (select 1 from public.subscriptions s join public.users u on u.id = s.user_id where s.site_id = sites.id and u.auth_id = auth.uid()));
-- Subscription rows are never exposed directly to browser clients. A shared anon key cannot
-- establish which site a request came from, so true per-site isolation belongs in the trusted
-- backend (each backend has a fixed SITE_ID and server-only service-role key).
create or replace function public.has_paid_access(p_site_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from subscriptions s join users u on u.id = s.user_id
    where u.auth_id = auth.uid() and s.site_id = p_site_id
      and s.payment_status in ('active', 'trialing')
  );
$$;
revoke all on function public.has_paid_access(uuid) from public;
grant execute on function public.has_paid_access(uuid) to authenticated;
-- No client write policies: Stripe and site/dashboard backend code use the service role only
-- on the server. Every site backend scopes entitlement queries to its fixed SITE_ID.
