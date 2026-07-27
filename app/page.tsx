import { getDashboardData } from '@/lib/dashboard-data'
import { requireDashboardAdmin } from '@/lib/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { DashboardTools } from '@/components/dashboard-tools'
import { ProjectTable } from '@/components/project-table'
import { SubscriptionTable } from '@/components/subscription-table'
import { ManualAccessForm } from '@/components/manual-access-form'
import { ManualAccessTable } from '@/components/manual-access-table'
import { ActivityTable } from '@/components/activity-table'
import { RegisteredUsersTable } from '@/components/registered-users-table'

type StatusKind = 'healthy' | 'warning' | 'working'

function statusKind(value: string): StatusKind {
  if (/running|pending|queued|validating/i.test(value)) return 'working'
  if (/fail|error|down|cancel|past_due|unpaid/i.test(value)) return 'warning'
  return 'healthy'
}
function Status({ value }: { value: string }) {
  const kind = statusKind(value)
  const icon = kind === 'healthy' ? '✓' : kind === 'working' ? '↻' : '△'
  return <span className={`status ${kind}`}><span aria-hidden="true">{icon}</span>{value}</span>
}

export default async function Dashboard({ searchParams }: { searchParams: { site?: string; plan?: string } }) {
  await requireDashboardAdmin()
  const { projects, subscriptions, sites: allSites, manualAccess, activity, users } = await getDashboardData()
  const sites = [...new Set(subscriptions.map((s: any) => s.sites?.name).filter(Boolean))] as string[]
  const plans = [...new Set(subscriptions.map((s: any) => s.plan).filter(Boolean))] as string[]
  const filtered = subscriptions.filter((s: any) => (!searchParams.site || s.sites?.name === searchParams.site) && (!searchParams.plan || s.plan === searchParams.plan))
  const healthy = projects.filter(p => statusKind(p.uptime) === 'healthy').length
  const uptimeAverage = projects.length ? `${Math.round((healthy / projects.length) * 100)}%` : '—'
  const activeErrors = projects.reduce((total, project) => total + (project.errors ?? 0), 0)
  const mrr = subscriptions.reduce((total: number, item: any) => total + (item.payment_status === 'active' ? item.mrr_cents ?? 0 : 0), 0)
  return <div className="app-shell">
    <aside className="sidebar"><a className="product" href="/"><img className="logo-mark" src="/system-icon.svg" alt="" /><span>Automation<br />console</span></a><nav className="side-nav"><a className="nav-item active" href="/"><span>⌂</span>Overview</a><a className="nav-item" href="#projects"><span>⇡</span>Deploys</a><a className="nav-item" href="#projects"><span>◉</span>Monitoring</a><a className="nav-item" href="#users"><span>♙</span>Users</a><a className="nav-item" href="#users"><span>▣</span>Billing</a><a className="nav-item" href="#settings"><span>⚙</span>Settings</a></nav><div className="sidebar-bottom"><ThemeToggle /><a href="/api/auth/signout">Sign out</a></div></aside>
    <main><header className="topbar"><h1>Overview</h1><DashboardTools projects={projects.map(p => ({ id: p.id, name: p.name, domain: p.sites?.[0]?.domain }))} users={subscriptions.map((s: any) => ({ id: s.id, name: s.users?.email ?? '', email: s.users?.email }))} /></header>
      <section className="metrics" aria-label="Portfolio metrics"><article><span>Projects</span><b>{projects.length}</b></article><article><span>Uptime average</span><b className="healthy-number">{uptimeAverage}</b></article><article><span>Active errors</span><b className={activeErrors ? 'warning-number' : ''}>{activeErrors}</b></article><article><span>MRR</span><b>{mrr ? `$${(mrr / 100).toLocaleString()}` : '—'}</b></article></section>
      <section id="projects"><div className="section-heading"><div><h2>Projects</h2><p>Deploy and service health · use ↑ ↓ and Enter to inspect</p></div></div><ProjectTable projects={projects} /></section>
      <section id="users"><div className="section-heading"><div><h2>Users and billing</h2><p>Pause access per site without disabling the user's central account.</p></div><form className="filters"><select name="site" defaultValue={searchParams.site ?? ''} aria-label="Filter by site"><option value="">All sites</option>{sites.map(site => <option key={site}>{site}</option>)}</select><select name="plan" defaultValue={searchParams.plan ?? ''} aria-label="Filter by plan"><option value="">All plans</option>{plans.map(plan => <option key={plan}>{plan}</option>)}</select><button className="secondary">Filter</button></form></div><SubscriptionTable subscriptions={filtered as any[]} /></section>
      <section><div className="section-heading"><div><h2>Registered users</h2><p>All accounts from the shared login system, including users without a subscription.</p></div></div><RegisteredUsersTable users={users as any[]} /></section>
      <section id="manual-access"><div className="section-heading"><div><h2>Manual project access</h2><p>For existing apps such as myShopCare. Set a person paid, unpaid, or paused by email.</p></div></div><ManualAccessForm sites={allSites as any[]} /><ManualAccessTable entries={manualAccess as any[]} /></section>
      <section id="activity"><div className="section-heading"><div><h2>Site activity</h2><p>Recent visitor and signed-in user activity. Visitor IDs are anonymous unless a trusted site sends an email.</p></div></div><ActivityTable activity={activity as any[]} /></section>
    </main>
  </div>
}
