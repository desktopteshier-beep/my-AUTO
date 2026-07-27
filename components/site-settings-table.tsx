'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Site = { id: string; name: string; domain: string; tracking_key: string }

export function SiteSettingsTable({ sites }: { sites: Site[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  async function save(site: Site, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true); setMessage('')
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget).entries())
      const response = await fetch(`/api/sites/${site.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) return setMessage(result.error ?? `Unable to update site (${response.status}).`)
      setEditing(null); router.refresh()
    } catch {
      setMessage('Could not reach the server. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }
  async function copyKey(site: Site) {
    await navigator.clipboard.writeText(site.tracking_key)
    setCopied(site.id)
    setTimeout(() => setCopied(null), 1800)
  }

  return <div className="table-wrap"><table><thead><tr><th>Site</th><th>Domain</th><th>Tracking key</th><th></th></tr></thead><tbody>
    {sites.map(site => editing === site.id ? <tr key={site.id}><td colSpan={4}><form className="quick-edit" onSubmit={event => save(site, event)}><label>Site name<input name="name" defaultValue={site.name} required /></label><label>Domain<input name="domain" defaultValue={site.domain} required /></label>{message && <p className="quick-edit-error">{message}</p>}<div><button type="button" onClick={() => { setEditing(null); setMessage('') }}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div></form></td></tr> : <tr key={site.id}><td><strong>{site.name}</strong></td><td>{site.domain}</td><td><code>{site.tracking_key.slice(0, 8)}…</code> <button className="copy-button" onClick={() => copyKey(site)}>{copied === site.id ? 'Copied ✓' : 'Copy'}</button></td><td><button className="access-button" onClick={() => { setEditing(site.id); setMessage('') }}>Edit</button></td></tr>)}
    {!sites.length && <tr><td colSpan={4} className="empty"><strong>No sites yet</strong><p>Add a project to register its site here.</p></td></tr>}
  </tbody></table></div>
}
