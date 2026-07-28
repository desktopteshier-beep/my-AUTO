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
  const { accessOverride, accessDurationDays } = await request.json() as { accessOverride?: string; accessDurationDays?: number }
  const update: Record<string, unknown> = {}
  if (accessOverride !== undefined) {
    if (!['automatic', 'paused'].includes(accessOverride)) return NextResponse.json({ error: 'Invalid access setting.' }, { status: 400 })
    update.access_override = accessOverride
  }
  if (accessDurationDays !== undefined) {
    const days = Number(accessDurationDays)
    if (!Number.isFinite(days) || days <= 0) return NextResponse.json({ error: 'Enter a positive number of days.' }, { status: 400 })
    update.access_expires_at = new Date(Date.now() + days * 86400000).toISOString()
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  const { error } = await getAdminSupabase().from('project_access').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
