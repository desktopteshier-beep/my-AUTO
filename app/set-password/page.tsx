'use client'

import { useState } from 'react'
import { getPublicSupabase } from '@/lib/supabase'

export default function SetPasswordPage() {
  const [password, setPassword] = useState(''); const [message, setMessage] = useState('')
  async function savePassword(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 8) return setMessage('Use at least 8 characters.')
    const { error } = await getPublicSupabase().auth.updateUser({ password })
    if (error) return setMessage('This setup link expired. Please request a new one.')
    location.assign('/login')
  }
  return <main className="login"><div className="card"><p className="eyebrow">CONTROL PLANE</p><h1>Create password</h1><p className="subtle">You will use this password for future sign-ins.</p><form onSubmit={savePassword}><input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /><button>Save password</button></form>{message && <p className="subtle">{message}</p>}</div></main>
}
