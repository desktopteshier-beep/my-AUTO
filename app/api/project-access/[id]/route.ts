import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/supabase'

async function isAdmin(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false
  const auth = createServerClient(url, key, { cookies: { getAll: () => request.headers.get('cookie')?.split('; ').filter(Boolean).map(part => { const [name, ...value] = part.split('='); return { name, value: value.join('=') } }) ?? [], setAll: () => {} } })
  const { data: { user } } = await auth.auth.getUser()
  const allowed = (process.env.DASHBOARD_ADMIN_USER_IDS ?? '').split(',').map(value => value.trim()).filter(Boolean)
  return Boolean(user && allowed.includes(user.id))
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  const { accessOverride } = await request.json() as { accessOverride?: string }
  if (!['automatic', 'paused'].includes(accessOverride ?? '')) return NextResponse.json({ error: 'Invalid access setting.' }, { status: 400 })
  const { error } = await getAdminSupabase().from('project_access').update({ access_override: accessOverride }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
