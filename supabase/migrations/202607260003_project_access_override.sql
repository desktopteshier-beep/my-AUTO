create type public.access_override as enum ('automatic', 'paused');

alter table public.subscriptions
  add column if not exists access_override public.access_override not null default 'automatic';

-- A site backend should call this with its own fixed site ID before serving paid features.
-- Pausing a user applies only to that site; it does not disable the central Auth account.
create or replace function public.has_paid_access(p_site_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from subscriptions s join users u on u.id = s.user_id
    where u.auth_id = auth.uid() and s.site_id = p_site_id
      and s.access_override <> 'paused'
      and s.payment_status in ('active', 'trialing')
  );
$$;
