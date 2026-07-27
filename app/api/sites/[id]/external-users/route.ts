import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/supabase'
import { listExternalUsers } from '@/lib/external-users'

async function isAdmin(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false
  const auth = createServerClient(url, key, { cookies: { getAll: () => request.headers.get('cookie')?.split('; ').filter(Boolean).map(part => { const [name, ...value] = part.split('='); return { name, value: value.join('=') } }) ?? [], setAll: () => {} } })
  const { data: { user } } = await auth.auth.getUser()
  const allowed = (process.env.DASHBOARD_ADMIN_USER_IDS ?? '').split(',').map(value => value.trim()).filter(Boolean)
  return Boolean(user && allowed.includes(user.id))
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  const db = getAdminSupabase()
  const { data: project } = await db.from('projects').select('external_supabase_url,external_service_role_key_enc').eq('site_id', params.id).maybeSingle()

  if (!project?.external_supabase_url) {
    // No connected Supabase project yet — fall back to whoever the site's own
    // beacon has reported signing in (see 202607270002_site_users.sql).
    const { data: roster } = await db.from('site_users').select('email,last_seen_at').eq('site_id', params.id).order('last_seen_at', { ascending: false })
    return NextResponse.json({ source: 'activity', users: (roster ?? []).map(entry => ({ email: entry.email, lastSeen: entry.last_seen_at })) })
  }

  try {
    const users = await listExternalUsers(project)
    return NextResponse.json({ source: 'live', users: users.filter(user => user.email).map(user => ({ email: user.email, lastSeen: user.lastSignInAt ?? user.createdAt })) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Could not reach the connected Supabase project.' }, { status: 502 })
  }
}
