import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/supabase'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
  const auth = createServerClient(url, anonKey, { cookies: { getAll: () => request.headers.get('cookie')?.split('; ').filter(Boolean).map(part => { const [name, ...value] = part.split('='); return { name, value: value.join('=') } }) ?? [], setAll: () => {} } })
  const { data: { user } } = await auth.auth.getUser(); const allowed = (process.env.DASHBOARD_ADMIN_USER_IDS ?? '').split(',').map(x => x.trim()).filter(Boolean)
  if (!user || !allowed.includes(user.id)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  const { accessOverride } = await request.json() as { accessOverride: 'automatic' | 'paused' }
  if (!['automatic', 'paused'].includes(accessOverride)) return NextResponse.json({ error: 'Invalid access setting.' }, { status: 400 })
  const { error } = await getAdminSupabase().from('subscriptions').update({ access_override: accessOverride }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
