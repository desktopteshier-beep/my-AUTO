-- Add per-user manual pricing for project_access records.
alter table public.project_access
  add column if not exists price_cents integer;
