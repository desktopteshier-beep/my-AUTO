import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/supabase'

async function isAdmin(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false
  const auth = createServerClient(url, key, { cookies: { getAll: () => request.headers.get('cookie')?.split('; ').filter(Boolean).map(part => { const [name, ...value] = part.split('='); return { name, value: value.join('=') } }) ?? [], setAll: () => {} } })
  const { data: { user } } = await auth.auth.getUser()
  const allowed = (process.env.DASHBOARD_ADMIN_USER_IDS ?? '').split(',').map(x => x.trim()).filter(Boolean)
  return Boolean(user && allowed.includes(user.id))
}

export async function POST(request: Request) {
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  const input = await request.json() as { siteId?: string; email?: string; plan?: string; paymentStatus?: string; accessOverride?: string; accessDurationDays?: number }
  if (!input.siteId || !input.email || !input.paymentStatus) return NextResponse.json({ error: 'Choose a project, enter an email, and select payment status.' }, { status: 400 })
  const days = Number(input.accessDurationDays)
  const accessExpiresAt = Number.isFinite(days) && days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null
  const accessRecord: Record<string, unknown> = {
    site_id: input.siteId,
    email: input.email.trim().toLowerCase(),
    plan: input.plan?.trim() || 'manual',
    payment_status: input.paymentStatus,
    access_override: input.accessOverride === 'paused' ? 'paused' : 'automatic',
  }
  // The expiry column is optional during a rolling database migration. Avoid
  // referencing it at all when the admin has not set a fixed access length.
  if (accessExpiresAt) accessRecord.access_expires_at = accessExpiresAt
  const { error } = await getAdminSupabase().from('project_access').upsert(accessRecord, { onConflict: 'site_id,email' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
