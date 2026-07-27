import { getProjectsHealth } from '@/lib/dashboard-data'
import { ProjectTable } from '@/components/project-table'

export default async function DeploysPage() {
  const projects = await getProjectsHealth()
  const failing = projects.filter(p => /fail|error|cancel/i.test(p.deploy)).length
  const running = projects.filter(p => /running|pending|queued/i.test(p.deploy)).length
  return <div className="page-enter">
    <section className="metrics" aria-label="Deploy metrics"><article><span>Projects</span><b>{projects.length}</b></article><article><span>In progress</span><b>{running}</b></article><article><span>Failing</span><b className={failing ? 'warning-number' : ''}>{failing}</b></article></section>
    <section><div className="section-heading"><div><h2>Deploys</h2><p>Latest CI run per project · use ↑ ↓ and Enter to inspect</p></div></div><ProjectTable projects={projects} focus="deploy" /></section>
  </div>
}
