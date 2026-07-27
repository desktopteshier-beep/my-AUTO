'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
type Subscription = { id: string; plan: string; payment_status: string; access_override?: 'automatic' | 'paused'; users?: { email?: string }; sites?: { name?: string } }
function Status({ value, paused }: { value: string; paused?: boolean }) { const issue = paused || /past_due|unpaid|canceled|incomplete/.test(value); return <span className={`status ${issue ? 'warning' : 'healthy'}`}><span>{issue ? '!' : 'OK'}</span>{paused ? 'Access paused' : value}</span> }
export function SubscriptionTable({ subscriptions }: { subscriptions: Subscription[] }) { const router = useRouter(); const [busy, setBusy] = useState<string | null>(null)
  async function changeAccess(item: Subscription) {
    const next = item.access_override === 'paused' ? 'automatic' : 'paused'
    setBusy(item.id)
    try {
      const response = await fetch(`/api/subscriptions/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessOverride: next }) })
      if (!response.ok) return alert('Could not update access. Check dashboard permissions.')
      router.refresh()
    } catch {
      alert('Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(null)
    }
  }
  return <div className="table-wrap"><table><thead><tr><th>User email</th><th>Site</th><th>Plan</th><th>Payment status</th><th>Access</th></tr></thead><tbody>{subscriptions.map(item => <tr key={item.id}><td>{item.users?.email}</td><td>{item.sites?.name}</td><td>{item.plan}</td><td><Status value={item.payment_status} /></td><td><button className="access-button" disabled={busy === item.id} onClick={() => changeAccess(item)}>{busy === item.id ? 'Saving...' : item.access_override === 'paused' ? 'Restore access' : 'Pause access'}</button></td></tr>)}{!subscriptions.length && <tr><td colSpan={5} className="empty"><strong>No subscriptions yet</strong><p>Users will appear here after they subscribe to a site.</p></td></tr>}</tbody></table></div> }
