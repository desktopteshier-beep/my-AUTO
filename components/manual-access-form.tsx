'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type RosterUser = { email: string; lastSeen: string }

export function ManualAccessForm({ sites }: { sites: { id: string; name: string; domain: string }[] }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [siteId, setSiteId] = useState('')
  const [roster, setRoster] = useState<RosterUser[]>([])
  const [rosterSource, setRosterSource] = useState<'live' | 'activity' | null>(null)
  const [rosterLoading, setRosterLoading] = useState(false)

  useEffect(() => {
    if (!siteId) { setRoster([]); setRosterSource(null); return }
    let cancelled = false
    setRosterLoading(true)
    fetch(`/api/sites/${siteId}/external-users`)
      .then(response => response.json())
      .then(data => { if (!cancelled) { setRoster(data.users ?? []); setRosterSource(data.source ?? null) } })
      .catch(() => { if (!cancelled) { setRoster([]); setRosterSource(null) } })
      .finally(() => { if (!cancelled) setRosterLoading(false) })
    return () => { cancelled = true }
  }, [siteId])

  async function submit(form: FormData) {
    setSaving(true); setMessage('')
    const response = await fetch('/api/project-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: form.get('siteId'), email: form.get('email'), plan: form.get('plan'), paymentStatus: form.get('paymentStatus'), accessOverride: form.get('accessOverride') }) })
    const data = await response.json(); setSaving(false)
    if (!response.ok) return setMessage(data.error ?? 'Could not save access.')
    setMessage('Saved. This user can now be checked by the connected app.'); router.refresh()
  }

  const hint = !siteId ? '' : rosterLoading ? 'Looking up this project’s users…' : roster.length
    ? `${roster.length} known user${roster.length === 1 ? '' : 's'} found (${rosterSource === 'live' ? 'live from its Supabase project' : 'from recorded activity'}) — start typing the email to pick one.`
    : 'No known users yet — connect this project’s Supabase project in Settings, or type an email manually.'

  return <form className="manual-access" action={submit}>
    <select name="siteId" required value={siteId} onChange={event => setSiteId(event.target.value)}><option value="" disabled>Choose project</option>{sites.map(site => <option value={site.id} key={site.id}>{site.name} — {site.domain}</option>)}</select>
    <input name="email" type="email" required placeholder="User email" list="manual-access-roster" autoComplete="off" />
    <datalist id="manual-access-roster">{roster.map(user => <option key={user.email} value={user.email}>{`Last seen ${new Date(user.lastSeen).toLocaleDateString()}`}</option>)}</datalist>
    <input name="plan" defaultValue="manual" placeholder="Plan" />
    <select name="paymentStatus" defaultValue="active"><option value="active">Paid / active</option><option value="trialing">Trial</option><option value="past_due">Past due</option><option value="canceled">Unpaid / canceled</option></select>
    <select name="accessOverride" defaultValue="automatic"><option value="automatic">Allow by payment</option><option value="paused">Pause access</option></select>
    <button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save access'}</button>
    {message && <small>{message}</small>}
    {hint && <small>{hint}</small>}
  </form>
}
