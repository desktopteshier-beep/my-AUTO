import { getProjectsHealth, getSubscriptionsData, getActivityData, bucketActivityByDay } from '@/lib/dashboard-data'
import { ActivityChart } from '@/components/activity-chart'
import { activityLabel } from '@/components/activity-table'

const feedMeta: Record<string, { icon: string; hue: string }> = {
  page_view: { icon: '◎', hue: '--badge-blue' },
  signed_in: { icon: '→', hue: '--healthy' },
}
const defaultFeedMeta = { icon: '✦', hue: '--accent' }

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

export default async function OverviewPage() {
  const [projects, subscriptions, activityAll] = await Promise.all([getProjectsHealth(), getSubscriptionsData(), getActivityData(300)])
  const activity = activityAll.slice(0, 6)
  const chartData = bucketActivityByDay(activityAll)
  const healthy = projects.filter(p => statusKind(p.uptime) === 'healthy').length
  const uptimeAverage = projects.length ? `${Math.round((healthy / projects.length) * 100)}%` : '—'
  const activeErrors = projects.reduce((total, project) => total + (project.errors ?? 0), 0)
  const mrr = subscriptions.reduce((total: number, item: any) => total + (item.payment_status === 'active' ? item.mrr_cents ?? 0 : 0), 0)
  const needsAttention = projects.filter(p => statusKind(p.uptime) !== 'healthy' || statusKind(p.deploy) !== 'healthy' || (p.errors ?? 0) > 0)

  return <div className="page-enter">
    <section className="metrics" aria-label="Portfolio metrics"><article><span>Projects</span><b>{projects.length}</b></article><article><span>Uptime average</span><b className="healthy-number">{uptimeAverage}</b></article><article><span>Active errors</span><b className={activeErrors ? 'warning-number' : ''}>{activeErrors}</b></article><article><span>MRR</span><b>{mrr ? `$${(mrr / 100).toLocaleString()}` : '—'}</b></article></section>

    <section><div className="section-heading"><div><h2>Activity trend</h2><p>Visitor and sign-in events across every site, last 7 days.</p></div></div>
      <ActivityChart data={chartData} />
    </section>

    <section><div className="section-heading"><div><h2>Needs attention</h2><p>Projects with a deploy, uptime, or error signal worth a look.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Project</th><th>Deploy</th><th>Uptime</th><th>Errors</th></tr></thead><tbody>
        {needsAttention.map(project => <tr key={project.id}><td><strong>{project.name}</strong></td><td><Status value={project.deploy} /></td><td><Status value={project.uptime} /></td><td className={project.errors ? 'warning-number' : 'numeric'}>{project.errors ?? '--'}</td></tr>)}
        {!needsAttention.length && <tr><td colSpan={4} className="empty"><span>✓</span><strong>Everything looks healthy</strong><p>No deploy failures, downtime, or error spikes right now.</p></td></tr>}
      </tbody></table></div>
    </section>

    <section><div className="section-heading"><div><h2>Recent activity</h2><p>Latest visitor and signed-in user events across every site.</p></div><a className="secondary" href="/users">View all</a></div>
      <div className="table-wrap"><div className="feed">
        {activity.map((item: any) => { const meta = feedMeta[item.event_type] ?? defaultFeedMeta; const who = item.user_email ?? (item.anonymous_id ? `Visitor ${String(item.anonymous_id).slice(0, 8)}` : 'Anonymous visitor'); return <div key={item.id} className="feed-item">
          <span className="feed-icon" style={{ background: `color-mix(in srgb, var(${meta.hue}) 18%, transparent)`, color: `var(${meta.hue})` }} aria-hidden="true">{meta.icon}</span>
          <div className="feed-body"><strong>{item.sites?.name ?? 'Unknown site'}</strong><span>{who} · {activityLabel(item.event_type)}</span></div>
          <span className="feed-time">{new Date(item.created_at).toLocaleString()}</span>
        </div> })}
        {!activity.length && <p className="empty"><strong>No activity recorded yet</strong><br />Add the tracking beacon to each site to see visitors here.</p>}
      </div></div>
    </section>
  </div>
}
