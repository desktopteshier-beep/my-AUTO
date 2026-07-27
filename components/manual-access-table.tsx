 'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Access = { id: string; site_id: string; email: string; plan: string; payment_status: string; access_override: string; sites?: { name?: string } }
type Activity = { site_id: string; user_email: string | null; event_type: string; created_at: string }
export function ManualAccessTable({ entries, activity }: { entries: Access[]; activity: Activity[] }) {
  const router = useRouter(); const [busy, setBusy] = useState<string | null>(null)
  async function toggle(item: Access) {
    setBusy(item.id)
    try {
      const accessOverride = item.access_override === 'paused' ? 'automatic' : 'paused'
      const response = await fetch(`/api/project-access/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessOverride }) })
      if (!response.ok) return alert('Could not update access. Check dashboard permissions.')
      router.refresh()
    } catch {
      alert('Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(null)
    }
  }
  return <div className="table-wrap"><table><thead><tr><th>User email</th><th>Project</th><th>Plan</th><th>Payment</th><th>Last use</th><th>Access</th></tr></thead><tbody>{entries.map(item => {
    const lastUse = activity.find(event => event.site_id === item.site_id && event.user_email?.toLowerCase() === item.email.toLowerCase())
    return <tr key={item.id}><td>{item.email}</td><td>{item.sites?.name}</td><td>{item.plan}</td><td>{item.payment_status}</td><td>{lastUse ? `${lastUse.event_type.replace('_', ' ')} · ${new Date(lastUse.created_at).toLocaleString()}` : 'No tracked use yet'}</td><td><button className="access-button" disabled={busy === item.id} onClick={() => toggle(item)}>{busy === item.id ? 'Saving…' : item.access_override === 'paused' ? 'Restore access' : 'Pause access'}</button></td></tr>
  })}{!entries.length && <tr><td colSpan={6} className="empty"><strong>No manual access records</strong><p>Add a user above to control access for an existing project.</p></td></tr>}</tbody></table></div>
}
