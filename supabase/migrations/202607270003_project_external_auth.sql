-- Optional per-project connection to that project's own, separate Supabase
-- project. Used to look up its real signed-up users via the GoTrue Admin API
-- (auth.admin.listUsers) instead of typing emails in by hand. The service
-- role key is application-encrypted (see lib/crypto.ts) before storage and is
-- never sent back to the browser — only used server-side to call that
-- project's own Supabase API.
alter table public.projects
  add column if not exists external_supabase_url text,
  add column if not exists external_service_role_key_enc text;
