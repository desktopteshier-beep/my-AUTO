-- Auto-generated application secrets (currently just the passphrase that
-- encrypts connected projects' service role keys — see lib/crypto.ts).
-- Generated lazily on first use so there is no manual setup step. Service
-- role only; never read by any client or exposed through a browser policy.
create table if not exists public.app_secrets (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now()
);

alter table public.app_secrets enable row level security;
