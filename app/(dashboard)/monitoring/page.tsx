import { getProjectsHealth } from '@/lib/dashboard-data'
import { ProjectTable } from '@/components/project-table'

export default async function MonitoringPage() {
  const projects = await getProjectsHealth()
  const healthy = projects.filter(p => /^up$|healthy|running/i.test(p.uptime)).length
  const uptimeAverage = projects.length ? `${Math.round((healthy / projects.length) * 100)}%` : '—'
  const activeErrors = projects.reduce((total, project) => total + (project.errors ?? 0), 0)
  return <div className="page-enter">
    <section className="metrics" aria-label="Monitoring metrics"><article><span>Monitors</span><b>{projects.length}</b></article><article><span>Uptime average</span><b className="healthy-number">{uptimeAverage}</b></article><article><span>Active errors</span><b className={activeErrors ? 'warning-number' : ''}>{activeErrors}</b></article></section>
    <section><div className="section-heading"><div><h2>Monitoring</h2><p>Uptime and error signal per project · use ↑ ↓ and Enter to inspect</p></div></div><ProjectTable projects={projects} focus="monitoring" /></section>
  </div>
}
