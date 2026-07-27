import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/supabase'

function cookiesFrom(request: Request) { return request.headers.get('cookie')?.split('; ').filter(Boolean).map(part => { const [name, ...value] = part.split('='); return { name, value: value.join('=') } }) ?? [] }
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
  const auth = createServerClient(url, anonKey, { cookies: { getAll: () => cookiesFrom(request), setAll: () => {} } })
  const { data: { user } } = await auth.auth.getUser(); const allowed = (process.env.DASHBOARD_ADMIN_USER_IDS ?? '').split(',').map(x => x.trim()).filter(Boolean)
  if (!user || !allowed.includes(user.id)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  const input = await request.json() as { name: string; domain: string; monitoringEndpoint: string; monitoringCheckId?: string; sentryProjectSlug?: string }
  if (!input.name || !input.domain || !input.monitoringEndpoint) return NextResponse.json({ error: 'Project name, domain, and health URL are required.' }, { status: 400 })
  const db = getAdminSupabase(); const { data: project, error: projectError } = await db.from('projects').select('site_id').eq('id', params.id).single()
  if (projectError || !project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
  const { error: siteError } = await db.from('sites').update({ domain: input.domain.trim().toLowerCase() }).eq('id', project.site_id)
  if (siteError) return NextResponse.json({ error: siteError.message }, { status: 400 })
  const { error } = await db.from('projects').update({ name: input.name.trim(), monitoring_endpoint: input.monitoringEndpoint.trim(), monitoring_check_id: input.monitoringCheckId?.trim() || null, sentry_project_slug: input.sentryProjectSlug?.trim() || null }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
