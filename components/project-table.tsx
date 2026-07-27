'use client'

import { useEffect, useState } from 'react'

type Project = { id: string; name: string; deploy_target: string; deploy: string; uptime: string; errors: number | null; sites?: { domain: string }[] }
function kind(value: string) { if (/running|pending|queued|validating/i.test(value)) return 'working'; if (/fail|error|down|cancel|past_due|unpaid/i.test(value)) return 'warning'; return 'healthy' }
function Status({ value }: { value: string }) { const state = kind(value); const icon = state === 'healthy' ? 'OK' : state === 'working' ? '...' : '!'; return <span className={`status ${state}`}><span aria-hidden="true">{icon}</span>{value}</span> }

export function ProjectTable({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<Project | null>(null); const [index, setIndex] = useState(-1)
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (!projects.length || event.metaKey || event.ctrlKey) return; if (event.key === 'ArrowDown') { event.preventDefault(); setIndex(i => Math.min(projects.length - 1, i + 1)) } else if (event.key === 'ArrowUp') { event.preventDefault(); setIndex(i => Math.max(0, i - 1)) } else if (event.key === 'Enter' && index >= 0) setSelected(projects[index]); else if (event.key === 'Escape') setSelected(null) }; addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey) }, [projects, index])
  return <>
    <div className="table-wrap"><table><thead><tr><th>Project</th><th>Last deploy</th><th>Uptime</th><th>Error count</th></tr></thead><tbody>
      {projects.map((project, row) => <tr key={project.id} className={row === index ? 'row-active' : ''} onClick={() => setSelected(project)}><td><div className="project-name"><Status value={project.uptime} /><span><strong>{project.name}</strong><small>{project.sites?.[0]?.domain}</small></span></div></td><td><Status value={project.deploy} /></td><td><div className="uptime-cell"><Status value={project.uptime} /><span className="history-placeholder" title="Historical uptime will appear after monitor snapshots are collected">---</span></div></td><td className={project.errors ? 'warning-number' : 'numeric'}>{project.errors ?? '--'}</td></tr>)}
      {!projects.length && <tr><td colSpan={4} className="empty"><span>OK</span><strong>No projects yet</strong><p>Add your first site, app, or backend to start monitoring it.</p></td></tr>}
    </tbody></table></div>
    {selected && <><aside className="detail-panel" role="dialog" aria-modal="true"><header><div><p>Project details</p><h2>{selected.name}</h2></div><button onClick={() => setSelected(null)} aria-label="Close details">x</button></header><section><span>Domain</span><strong>{selected.sites?.[0]?.domain ?? 'Not set'}</strong></section><section><span>Deployment target</span><strong>{selected.deploy_target}</strong></section><section><span>Latest deploy</span><Status value={selected.deploy} /></section><section><span>Uptime</span><Status value={selected.uptime} /></section><section><span>Active errors</span><strong className={selected.errors ? 'warning-number' : ''}>{selected.errors ?? 0}</strong></section><p className="detail-note">Deploy history and monitor charts will appear here as monitoring snapshots accumulate.</p></aside><button className="detail-backdrop" onClick={() => setSelected(null)} aria-label="Close project details" /></>}
  </>
}
