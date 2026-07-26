'use client'
import { useState } from 'react'
import { getPublicSupabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState('')
  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    const { error } = await getPublicSupabase().auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/` } })
    setMessage(error ? error.message : 'Check your inbox for the secure sign-in link.')
  }
  return <main className="login"><div className="card"><p className="eyebrow">CONTROL PLANE</p><h1>Sign in</h1><p className="subtle">Use your shared Supabase identity.</p><form onSubmit={signIn}><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /><button>Send magic link</button></form>{message && <p className="subtle">{message}</p>}</div></main>
}
