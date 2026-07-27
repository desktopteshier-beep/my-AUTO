'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Project = { id: string; name: string; connected: boolean; supabaseUrl: string | null }

export function ProjectConnectionTable({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function save(project: Project, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true); setMessage('')
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget).entries())
      const response = await fetch(`/api/projects/${project.id}/connection`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supabaseUrl: values.supabaseUrl, serviceRoleKey: values.serviceRoleKey }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) return setMessage(result.error ?? `Unable to save connection (${response.status}).`)
      setEditing(null); router.refresh()
    } catch {
      setMessage('Could not reach the server. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }
  async function disconnect(project: Project) {
    if (!confirm(`Disconnect ${project.name}'s Supabase project? Its manual-access picker will fall back to recorded activity.`)) return
    setSaving(true); setMessage('')
    try {
      const response = await fetch(`/api/projects/${project.id}/connection`, { method: 'DELETE' })
      if (!response.ok) { const result = await response.json().catch(() => ({})); return setMessage(result.error ?? 'Unable to disconnect.') }
      router.refresh()
    } catch {
      setMessage('Could not reach the server. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="table-wrap"><table><thead><tr><th>Project</th><th>Status</th><th>Supabase URL</th><th></th></tr></thead><tbody>
    {projects.map(project => editing === project.id ? <tr key={project.id}><td colSpan={4}><form className="quick-edit" onSubmit={event => save(project, event)}>
      <label>Supabase URL<input name="supabaseUrl" type="url" defaultValue={project.supabaseUrl ?? ''} placeholder="https://xxxx.supabase.co" required /></label>
      <label>Service role key<input name="serviceRoleKey" type="password" placeholder={project.connected ? 'Leave blank to keep existing key' : 'eyJhbGc…'} autoComplete="off" /></label>
      {message && <p className="quick-edit-error">{message}</p>}
      <div><button type="button" onClick={() => { setEditing(null); setMessage('') }}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save connection'}</button></div>
    </form></td></tr> : <tr key={project.id}>
      <td><strong>{project.name}</strong></td>
      <td><span className={`status ${project.connected ? 'healthy' : 'neutral'}`}><span aria-hidden="true">{project.connected ? '✓' : '--'}</span>{project.connected ? 'Connected' : 'Not connected'}</span></td>
      <td>{project.supabaseUrl ?? '—'}</td>
      <td><button className="access-button" onClick={() => { setEditing(project.id); setMessage('') }}>{project.connected ? 'Edit' : 'Connect'}</button>{project.connected && <button className="access-button" disabled={saving} onClick={() => disconnect(project)}>Disconnect</button>}</td>
    </tr>)}
    {!projects.length && <tr><td colSpan={4} className="empty"><strong>No projects yet</strong><p>Add a project to connect its Supabase project here.</p></td></tr>}
    {message && !editing && <tr><td colSpan={4} className="quick-edit-error">{message}</td></tr>}
  </tbody></table></div>
}
