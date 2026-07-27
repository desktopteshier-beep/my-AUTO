import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/supabase'
import { encryptSecret } from '@/lib/crypto'

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
  const { supabaseUrl, serviceRoleKey } = await request.json() as { supabaseUrl?: string; serviceRoleKey?: string }
  if (!supabaseUrl?.trim()) return NextResponse.json({ error: 'Supabase URL is required.' }, { status: 400 })
  try {
    const update: { external_supabase_url: string; external_service_role_key_enc?: string } = { external_supabase_url: supabaseUrl.trim() }
    if (serviceRoleKey?.trim()) update.external_service_role_key_enc = await encryptSecret(serviceRoleKey.trim())
    const { error } = await getAdminSupabase().from('projects').update(update).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Could not save this connection.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  const { error } = await getAdminSupabase().from('projects').update({ external_supabase_url: null, external_service_role_key_enc: null }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
