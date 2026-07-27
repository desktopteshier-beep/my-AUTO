'use client'
import { useState } from 'react'
import { getPublicSupabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState('')
  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    const { error } = await getPublicSupabase().auth.signInWithPassword({ email, password })
    if (!error) location.assign('/')
    else setMessage('Email or password is incorrect.')
  }
  return <main className="login"><div className="card"><p className="eyebrow">CONTROL PLANE</p><h1>Sign in</h1><p className="subtle">Use your email and password.</p><form onSubmit={signIn}><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /><input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" /><button>Sign in</button></form>{message && <p className="subtle">{message}</p>}<a className="password-link" href="/forgot-password">Set or reset password</a></div></main>
}
