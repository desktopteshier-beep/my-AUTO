import { getDashboardData } from '@/lib/dashboard-data'
import { requireDashboardAdmin } from '@/lib/auth'
import { ThemeToggle } from '@/components/theme-toggle'

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
  const { projects, subscriptions } = await getDashboardData()
  const sites = [...new Set(subscriptions.map((s: any) => s.sites?.name).filter(Boolean))] as string[]
  const plans = [...new Set(subscriptions.map((s: any) => s.plan).filter(Boolean))] as string[]
  const filtered = subscriptions.filter((s: any) => (!searchParams.site || s.sites?.name === searchParams.site) && (!searchParams.plan || s.plan === searchParams.plan))
  const healthy = projects.filter(p => statusKind(p.uptime) === 'healthy').length
  const uptimeAverage = projects.length ? `${Math.round((healthy / projects.length) * 100)}%` : '—'
  const activeErrors = projects.reduce((total, project) => total + (project.errors ?? 0), 0)
  const mrr = subscriptions.reduce((total: number, item: any) => total + (item.payment_status === 'active' ? item.mrr_cents ?? 0 : 0), 0)
  return <div className="app-shell">
    <aside className="sidebar"><a className="product" href="/"><span className="logo-mark">A</span><span>Automation<br />console</span></a><nav className="side-nav"><a className="nav-item active" href="/"><span>⌂</span>Overview</a><a className="nav-item" href="#projects"><span>⇡</span>Deploys</a><a className="nav-item" href="#projects"><span>◉</span>Monitoring</a><a className="nav-item" href="#users"><span>♙</span>Users</a><a className="nav-item" href="#users"><span>▣</span>Billing</a><a className="nav-item" href="#settings"><span>⚙</span>Settings</a></nav><div className="sidebar-bottom"><ThemeToggle /><a href="/api/auth/signout">Sign out</a></div></aside>
    <main><header className="topbar"><h1>Overview</h1><div className="actions"><a className="secondary action-link" href="/">Refresh</a><a className="primary action-link" href="/projects/new">Add project</a></div></header>
      <section className="metrics" aria-label="Portfolio metrics"><article><span>Projects</span><b>{projects.length}</b></article><article><span>Uptime average</span><b className="healthy-number">{uptimeAverage}</b></article><article><span>Active errors</span><b className={activeErrors ? 'warning-number' : ''}>{activeErrors}</b></article><article><span>MRR</span><b>{mrr ? `$${(mrr / 100).toLocaleString()}` : '—'}</b></article></section>
      <section id="projects"><div className="section-heading"><div><h2>Projects</h2><p>Deploy and service health</p></div></div><div className="table-wrap"><table><thead><tr><th>Project</th><th>Last deploy</th><th>Uptime</th><th>Error count</th></tr></thead><tbody>{projects.map(project => <tr key={project.id}><td><div className="project-name"><Status value={project.uptime} /><span><strong>{project.name}</strong><small>{project.sites?.[0]?.domain}</small></span></div></td><td><Status value={project.deploy} /></td><td><Status value={project.uptime} /></td><td className={project.errors ? 'warning-number' : 'numeric'}>{project.errors ?? '—'}</td></tr>)}{!projects.length && <tr><td colSpan={4} className="empty">No projects yet. Add sites and projects in Supabase.</td></tr>}</tbody></table></div></section>
      <section id="users"><div className="section-heading"><div><h2>Users and billing</h2><p>Subscriptions from the shared identity system</p></div><form className="filters"><select name="site" defaultValue={searchParams.site ?? ''} aria-label="Filter by site"><option value="">All sites</option>{sites.map(site => <option key={site}>{site}</option>)}</select><select name="plan" defaultValue={searchParams.plan ?? ''} aria-label="Filter by plan"><option value="">All plans</option>{plans.map(plan => <option key={plan}>{plan}</option>)}</select><button className="secondary">Filter</button></form></div><div className="table-wrap"><table><thead><tr><th>User email</th><th>Site</th><th>Plan</th><th>Payment status</th></tr></thead><tbody>{filtered.map((item: any) => <tr key={item.id}><td>{item.users?.email}</td><td>{item.sites?.name}</td><td>{item.plan}</td><td><Status value={item.payment_status} /></td></tr>)}{!filtered.length && <tr><td colSpan={4} className="empty">No subscriptions match these filters.</td></tr>}</tbody></table></div></section>
    </main>
  </div>
}
