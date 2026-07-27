import { getAdminSupabase } from '@/lib/supabase'

type Project = {
  id: string; name: string; github_owner: string; github_repo: string; deploy_target: string
  monitoring_provider: 'better_uptime' | null; monitoring_check_id: string | null
  sentry_project_slug: string | null; site_id: string; sites: { name: string; domain: string }[]
}
export type ProjectHealth = Project & { deploy: string; uptime: string; errors: number | null }
export type SiteActivity = { id: string; site_id: string; event_type: string; user_email: string | null; anonymous_id: string | null; path: string | null; created_at: string; sites: { name: string } | null }

const subscriptionFields = 'id,plan,payment_status,access_override,renewal_date,mrr_cents,currency,users(email),sites(name)'
const legacySubscriptionFields = 'id,plan,payment_status,renewal_date,users(email),sites(name)'

async function getSubscriptions(db: ReturnType<typeof getAdminSupabase>) {
  const result = await db.from('subscriptions').select(subscriptionFields).order('updated_at', { ascending: false })
  if (!result.error) return result

  // Migrations 002 and 003 add these optional dashboard fields. During a rolling
  // deploy, keep the overview available until the database migration is applied.
  const missingOptionalField = /access_override|mrr_cents|currency/i.test(result.error.message)
  if (!missingOptionalField) return result

  const legacy = await db.from('subscriptions').select(legacySubscriptionFields).order('updated_at', { ascending: false })
  return {
    ...legacy,
    data: legacy.data?.map(subscription => ({
      ...subscription,
      access_override: 'automatic',
      mrr_cents: null,
      currency: null,
    })),
  }
}

async function safeFetch(url: string, init: RequestInit = {}) {
  try { const r = await fetch(url, { ...init, cache: 'no-store' }); return r.ok ? r.json() : null } catch { return null }
}
async function deploymentState(project: Project) {
  const token = process.env.GITHUB_TOKEN
  if (!token) return 'Not connected'
  const runs = await safeFetch(`https://api.github.com/repos/${project.github_owner}/${project.github_repo}/actions/runs?per_page=1`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } })
  const run = runs?.workflow_runs?.[0]
  return run ? `${run.status}${run.conclusion ? ` / ${run.conclusion}` : ''}` : 'No runs'
}
async function uptimeState(project: Project) {
  if (!project.monitoring_provider || !project.monitoring_check_id) return 'Not connected'
  if (project.monitoring_provider === 'better_uptime' && process.env.BETTER_UPTIME_API_TOKEN) {
    const monitor = await safeFetch(`https://uptime.betterstack.com/api/v2/monitors/${project.monitoring_check_id}`, { headers: { Authorization: `Bearer ${process.env.BETTER_UPTIME_API_TOKEN}` } })
    return monitor?.data?.attributes?.status ?? 'Unknown'
  }
  return 'Not connected'
}
async function errorCount(project: Project) {
  if (!project.sentry_project_slug || !process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG) return null
  const stats = await safeFetch(`https://sentry.io/api/0/projects/${process.env.SENTRY_ORG}/${project.sentry_project_slug}/stats/?stat=received&resolution=1h`, { headers: { Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}` } })
  return Array.isArray(stats) ? stats.reduce((n: number, point: [number, number]) => n + point[1], 0) : null
}
export async function getDashboardData() {
  const db = getAdminSupabase()
  const [{ data: projects, error: projectError }, { data: subscriptions, error: subscriptionError }, { data: sites, error: siteError }, { data: manualAccess, error: accessError }, { data: activity, error: activityError }, { data: users, error: userError }] = await Promise.all([
    db.from('projects').select('id,name,github_owner,github_repo,deploy_target,monitoring_provider,monitoring_check_id,monitoring_endpoint,sentry_project_slug,site_id,sites(name,domain)').order('name'),
    getSubscriptions(db),
    db.from('sites').select('id,name,domain').order('name'),
    db.from('project_access').select('id,site_id,email,plan,payment_status,access_override,sites(name)').order('updated_at', { ascending: false }),
    db.from('site_activity').select('id,site_id,event_type,user_email,anonymous_id,path,created_at,sites(name)').order('created_at', { ascending: false }).limit(100),
    db.from('users').select('id,email,created_at,subscriptions(plan,payment_status,sites(name))').order('created_at', { ascending: false }),
  ])
  // A newly deployed dashboard can arrive before its Supabase migration is run.
  // Keep the rest of the console usable in that short window; the manual-access
  // section becomes available as soon as migration 004 has been applied.
  const missingManualAccessTable = accessError?.code === '42P01'
  const missingActivityTable = activityError?.code === '42P01'
  if (projectError || subscriptionError || siteError || userError || (accessError && !missingManualAccessTable) || (activityError && !missingActivityTable)) throw projectError ?? subscriptionError ?? siteError ?? userError ?? accessError ?? activityError
  const normalizedProjects = (projects ?? []).map((project: any) => ({ ...project, sites: Array.isArray(project.sites) ? project.sites : project.sites ? [project.sites] : [] })) as Project[]
  const health = await Promise.all(normalizedProjects.map(async project => ({ ...project, deploy: await deploymentState(project), uptime: await uptimeState(project), errors: await errorCount(project) })))
  return { projects: health, subscriptions: subscriptions ?? [], sites: sites ?? [], manualAccess: manualAccess ?? [], activity: activity ?? [], users: users ?? [] }
}
