import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/supabase'

type ProjectInput = { siteName: string; domain: string; name: string; githubOwner: string; githubRepo: string; deployTarget: 'vercel' | 'aws_lambda' | 'aws_ecs'; monitoringEndpoint: string; monitoringCheckId?: string; sentryProjectSlug?: string; awsRegion?: string }

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
  const auth = createServerClient(url, anonKey, { cookies: { getAll: () => request.headers.get('cookie')?.split('; ').filter(Boolean).map(part => { const [name, ...value] = part.split('='); return { name, value: value.join('=') } }) ?? [], setAll: () => {} } })
  const { data: { user } } = await auth.auth.getUser()
  const allowed = (process.env.DASHBOARD_ADMIN_USER_IDS ?? '').split(',').map(x => x.trim()).filter(Boolean)
  if (!user || !allowed.includes(user.id)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  const input = await request.json() as ProjectInput
  if (!input.siteName || !input.domain || !input.name || !input.githubOwner || !input.githubRepo || !input.monitoringEndpoint) return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 })
  const db = getAdminSupabase()
  const { data: site, error: siteError } = await db.from('sites').upsert({ name: input.siteName.trim(), domain: input.domain.trim().toLowerCase() }, { onConflict: 'domain' }).select('id').single()
  if (siteError || !site) return NextResponse.json({ error: siteError?.message ?? 'Unable to save site.' }, { status: 400 })
  const { error: projectError } = await db.from('projects').insert({ site_id: site.id, name: input.name.trim(), github_owner: input.githubOwner.trim(), github_repo: input.githubRepo.trim(), deploy_target: input.deployTarget, iac_tool: input.deployTarget === 'vercel' ? null : 'cdk', aws_region: input.awsRegion?.trim() || null, monitoring_provider: 'better_uptime', monitoring_check_id: input.monitoringCheckId?.trim() || null, monitoring_endpoint: input.monitoringEndpoint.trim(), sentry_project_slug: input.sentryProjectSlug?.trim() || null })
  if (projectError) return NextResponse.json({ error: projectError.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
