 'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Access = { id: string; site_id: string; email: string; plan: string; payment_status: string; access_override: string; access_expires_at?: string | null; sites?: { name?: string } }
type Activity = { site_id: string; user_email: string | null; event_type: string; created_at: string }
export function ManualAccessTable({ entries, activity, usageDays }: { entries: Access[]; activity: Activity[]; usageDays?: Record<string, number> }) {
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
  async function extend(item: Access, days: number) {
    setBusy(item.id)
    try {
      const response = await fetch(`/api/project-access/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessDurationDays: days }) })
      if (!response.ok) return alert('Could not update expiry. Check dashboard permissions.')
      router.refresh()
    } catch {
      alert('Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(null)
    }
  }
  function expiryLabel(item: Access) {
    if (!item.access_expires_at) return 'No expiry'
    const remainingMs = new Date(item.access_expires_at).getTime() - Date.now()
    const remainingDays = Math.ceil(remainingMs / 86400000)
    const date = new Date(item.access_expires_at).toLocaleDateString()
    if (remainingMs <= 0) return `Expired ${date}`
    return `${remainingDays} day${remainingDays === 1 ? '' : 's'} left (${date})`
  }
  return <div className="table-wrap"><table><thead><tr><th>User email</th><th>Project</th><th>Plan</th><th>Payment</th><th>Expires</th><th>Days active</th><th>Last use</th><th>Access</th></tr></thead><tbody>{entries.map(item => {
    const lastUse = activity.find(event => event.site_id === item.site_id && event.user_email?.toLowerCase() === item.email.toLowerCase())
    const days = usageDays?.[`${item.site_id}|${item.email.toLowerCase()}`] ?? 0
    return <tr key={item.id}><td>{item.email}</td><td>{item.sites?.name}</td><td>{item.plan}</td><td>{item.payment_status}</td><td><form onSubmit={event => { event.preventDefault(); const value = Number(new FormData(event.currentTarget).get('days')); if (value > 0) extend(item, value) }} style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span>{expiryLabel(item)}</span><input name="days" type="number" min="1" step="1" placeholder="days" style={{ width: 64 }} /><button className="secondary" type="submit" disabled={busy === item.id}>Set</button></form></td><td className="numeric">{days ? `${days} day${days === 1 ? '' : 's'}` : '—'}</td><td>{lastUse ? `${lastUse.event_type.replace('_', ' ')} · ${new Date(lastUse.created_at).toLocaleString()}` : 'No tracked use yet'}</td><td><button className="access-button" disabled={busy === item.id} onClick={() => toggle(item)}>{busy === item.id ? 'Saving…' : item.access_override === 'paused' ? 'Restore access' : 'Pause access'}</button></td></tr>
  })}{!entries.length && <tr><td colSpan={8} className="empty"><strong>No manual access records</strong><p>Add a user above to control access for an existing project.</p></td></tr>}</tbody></table></div>
}
