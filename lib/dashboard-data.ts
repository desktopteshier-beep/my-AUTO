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

export async function getSubscriptionsData() {
  const db = getAdminSupabase()
  const result = await db.from('subscriptions').select(subscriptionFields).order('updated_at', { ascending: false })
  if (!result.error) return result.data ?? []

  // Migrations 002 and 003 add these optional dashboard fields. During a rolling
  // deploy, keep the overview available until the database migration is applied.
  const missingOptionalField = /access_override|mrr_cents|currency/i.test(result.error.message)
  if (!missingOptionalField) throw result.error

  const legacy = await db.from('subscriptions').select(legacySubscriptionFields).order('updated_at', { ascending: false })
  if (legacy.error) throw legacy.error
  return (legacy.data ?? []).map(subscription => ({ ...subscription, access_override: 'automatic', mrr_cents: null, currency: null }))
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
export async function getProjectsHealth(): Promise<ProjectHealth[]> {
  const db = getAdminSupabase()
  const { data: projects, error } = await db.from('projects').select('id,name,github_owner,github_repo,deploy_target,monitoring_provider,monitoring_check_id,monitoring_endpoint,sentry_project_slug,site_id,sites(name,domain)').order('name')
  if (error) throw error
  const normalized = (projects ?? []).map((project: any) => ({ ...project, sites: Array.isArray(project.sites) ? project.sites : project.sites ? [project.sites] : [] })) as Project[]
  return Promise.all(normalized.map(async project => ({ ...project, deploy: await deploymentState(project), uptime: await uptimeState(project), errors: await errorCount(project) })))
}

export async function getSitesData() {
  const { data, error } = await getAdminSupabase().from('sites').select('id,name,domain,tracking_key').order('name')
  if (error) throw error
  return data ?? []
}

async function ignoreMissingTable<T>(query: PromiseLike<{ data: T | null; error: any }>, fallback: NonNullable<T>) {
  const { data, error } = await query
  if (error && error.code === '42P01') return fallback
  if (error) throw error
  return data ?? fallback
}

export async function getManualAccessData() {
  const db = getAdminSupabase()
  const result = await db.from('project_access').select('id,site_id,email,plan,payment_status,access_override,access_expires_at,price_cents,price_currency,sites(name)').order('updated_at', { ascending: false })
  if (!result.error) return result.data ?? []
  if (result.error.code === '42P01') return [] as any[]

  // Migration 202607280001 adds access_expires_at and 202607300001 adds price_currency.
  // Keep the page available during a rolling deploy while the schema is updated.
  if (!/access_expires_at|price_currency/i.test(result.error.message)) throw result.error
  const legacy = await db.from('project_access').select('id,site_id,email,plan,payment_status,access_override,price_cents,sites(name)').order('updated_at', { ascending: false })
  if (legacy.error) throw legacy.error
  return (legacy.data ?? []).map(row => ({ ...row, access_expires_at: null, price_currency: 'usd' }))
}

export async function getActivityData(limit = 100) {
  return ignoreMissingTable(
    getAdminSupabase().from('site_activity').select('id,site_id,event_type,user_email,anonymous_id,path,created_at,sites(name)').order('created_at', { ascending: false }).limit(limit),
    [] as any[],
  )
}

// Buckets already-fetched activity rows into calendar-day counts for the Overview trend chart.
export function bucketActivityByDay(rows: { created_at: string }[], days = 7) {
  const counts = new Map<string, number>()
  const order: string[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today)
    day.setUTCDate(day.getUTCDate() - i)
    const key = day.toISOString().slice(0, 10)
    order.push(key)
    counts.set(key, 0)
  }
  for (const row of rows) {
    const key = row.created_at.slice(0, 10)
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1)
  }
  return order.map(key => ({ label: new Date(`${key}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }), count: counts.get(key) ?? 0 }))
}

export async function getSiteUsersData() {
  return ignoreMissingTable(
    getAdminSupabase().from('site_users').select('site_id,email,first_seen_at,last_seen_at,sign_in_count').order('last_seen_at', { ascending: false }),
    [] as any[],
  )
}

// Distinct calendar days a user shows up in site_activity — "how many days has
// this person actually used it", not just first/last seen. Reads the full
// table (not the capped getActivityData() feed) since a rolling 100-row cap
// would undercount anyone with more than a handful of recorded events.
export async function getUsageDaysData() {
  const rows = await ignoreMissingTable(
    getAdminSupabase().from('site_activity').select('site_id,user_email,created_at').not('user_email', 'is', null),
    [] as { site_id: string; user_email: string; created_at: string }[],
  )
  const perSiteDays = new Map<string, Set<string>>()
  const perEmailDays = new Map<string, Set<string>>()
  for (const row of rows) {
    const email = row.user_email.toLowerCase()
    const day = row.created_at.slice(0, 10)
    const siteKey = `${row.site_id}|${email}`
    if (!perSiteDays.has(siteKey)) perSiteDays.set(siteKey, new Set())
    perSiteDays.get(siteKey)!.add(day)
    if (!perEmailDays.has(email)) perEmailDays.set(email, new Set())
    perEmailDays.get(email)!.add(day)
  }
  return {
    perSite: Object.fromEntries([...perSiteDays].map(([key, days]) => [key, days.size])) as Record<string, number>,
    perEmail: Object.fromEntries([...perEmailDays].map(([email, days]) => [email, days.size])) as Record<string, number>,
  }
}

export async function getProjectConnectionsData() {
  const { data, error } = await getAdminSupabase().from('projects').select('id,name,site_id,external_supabase_url').order('name')
  if (error) throw error
  return (data ?? []).map((p: any) => ({ id: p.id as string, name: p.name as string, siteId: p.site_id as string, connected: Boolean(p.external_supabase_url), supabaseUrl: p.external_supabase_url as string | null }))
}

export async function getUsersData() {
  const { data, error } = await getAdminSupabase().from('users').select('id,email,created_at,subscriptions(plan,payment_status,sites(name))').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// Lightweight lookup for the sidebar command palette — avoids paying for the
// GitHub/Sentry/BetterUptime round trips that getProjectsHealth() makes.
export async function getNavSearchData() {
  const db = getAdminSupabase()
  const [{ data: projects, error: projectError }, { data: users, error: userError }] = await Promise.all([
    db.from('projects').select('id,name,sites(domain)').order('name'),
    db.from('users').select('id,email').order('email'),
  ])
  if (projectError) throw projectError
  if (userError) throw userError
  return {
    projects: (projects ?? []).map((p: any) => ({ id: p.id, name: p.name, domain: Array.isArray(p.sites) ? p.sites[0]?.domain : p.sites?.domain })),
    users: (users ?? []).map((u: any) => ({ id: u.id, name: u.email, email: u.email })),
  }
}
