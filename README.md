# Portfolio Control Plane

One Next.js dashboard for shared authentication, subscriptions, CI/CD visibility, uptime, and Sentry error totals.

## First-time setup

1. Create one Supabase project and apply `supabase/migrations/202607260001_control_plane.sql` using the Supabase CLI or SQL editor.
2. In **Authentication → URL configuration**, add the dashboard URL and every site URL as redirect URLs. Configure the preferred providers in that same shared project; all applications use its URL and anon key.
3. Copy `.env.example` to `.env.local`. Put only the public URL/anon key in frontends. Keep `SUPABASE_SERVICE_ROLE_KEY`, Stripe, and provider tokens only in server environments.
4. Create dashboard operators in Supabase Auth, then add their Auth UUIDs to `DASHBOARD_ADMIN_USER_IDS`.
5. Add `sites`, then `projects` in Supabase. The `projects` table is the inventory: repo, deploy target, monitor ID/endpoint, and Sentry slug.
6. Configure Stripe to send `customer.subscription.*` and `checkout.session.completed` events to `https://YOUR_DASHBOARD/api/webhooks/stripe`. Every subscription Checkout Session must attach `site_id`, `auth_user_id`, and `plan` metadata (metadata is copied to the subscription).

## Entitlement check in a site backend

Verify the shared Supabase JWT, map `auth.uid()` to `users.auth_id`, and query `subscriptions` for both the current user and that backend's fixed `SITE_ID`. Grant paid access only for `active` or `trialing`. Do not expose the service-role key or rely on a client-supplied site ID for authorization.

The migration intentionally does not expose subscription rows to browsers; a single shared anon key cannot prove which site made a request. Browser code can call `has_paid_access(site_id)` for a boolean only, while trusted site backends query records with their fixed, server-side `SITE_ID`. It permits no browser writes. Stripe webhook and trusted site/dashboard server code use the service role, scoped to a server-side configured site ID.

## CI/CD reuse

Reference `.github/workflows/reusable-deploy.yml` from each repository as shown in `.github/workflows/example-caller.yml`. AWS deploys use GitHub OIDC and a caller-provided CDK command; Vercel uses `VERCEL_TOKEN` via inherited secrets.

## Monitoring adapters

The dashboard reads Better Uptime monitor status from `projects.monitoring_check_id`, plus GitHub Actions and Sentry when the corresponding server token is configured. Configure Slack/email escalation in Better Uptime and alert rules in Sentry; no alerting secret is exposed to the browser.
