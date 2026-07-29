-- Add price currency support for manual project_access pricing.
alter table public.project_access
  add column if not exists price_currency text;
