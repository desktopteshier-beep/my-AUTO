'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ManualAccessForm({ sites }: { sites: { id: string; name: string; domain: string }[] }) {
  const router = useRouter(); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false)
  async function submit(form: FormData) {
    setSaving(true); setMessage('')
    const response = await fetch('/api/project-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: form.get('siteId'), email: form.get('email'), plan: form.get('plan'), paymentStatus: form.get('paymentStatus'), accessOverride: form.get('accessOverride') }) })
    const data = await response.json(); setSaving(false)
    if (!response.ok) return setMessage(data.error ?? 'Could not save access.')
    setMessage('Saved. This user can now be checked by the connected app.'); router.refresh()
  }
  return <form className="manual-access" action={submit}>
    <select name="siteId" required defaultValue=""><option value="" disabled>Choose project</option>{sites.map(site => <option value={site.id} key={site.id}>{site.name} — {site.domain}</option>)}</select>
    <input name="email" type="email" required placeholder="User email" />
    <input name="plan" defaultValue="manual" placeholder="Plan" />
    <select name="paymentStatus" defaultValue="active"><option value="active">Paid / active</option><option value="trialing">Trial</option><option value="past_due">Past due</option><option value="canceled">Unpaid / canceled</option></select>
    <select name="accessOverride" defaultValue="automatic"><option value="automatic">Allow by payment</option><option value="paused">Pause access</option></select>
    <button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save access'}</button>
    {message && <small>{message}</small>}
  </form>
}
