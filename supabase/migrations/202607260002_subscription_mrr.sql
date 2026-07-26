alter table public.subscriptions
  add column if not exists mrr_cents integer,
  add column if not exists currency text;
