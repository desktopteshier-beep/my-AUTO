'use client'

import { useState } from 'react'
import { getPublicSupabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState('')
  async function sendReset(event: React.FormEvent) {
    event.preventDefault()
    const { error } = await getPublicSupabase().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/set-password` })
    setMessage(error ? error.message : 'Check your email once, then choose your password.')
  }
  return <main className="login"><div className="card"><p className="eyebrow">CONTROL PLANE</p><h1>Set your password</h1><p className="subtle">Use this once to create or reset your password.</p><form onSubmit={sendReset}><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /><button>Send setup link</button></form>{message && <p className="subtle">{message}</p>}<a className="password-link" href="/login">Back to sign in</a></div></main>
}
