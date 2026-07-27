import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

type ActivityInput = { siteKey?: string; event?: string; anonymousId?: string; userEmail?: string; path?: string }
const eventTypes = new Set(['page_view', 'signed_in', 'feature_use'])

function value(input: unknown, maximum: number) {
  return typeof input === 'string' ? input.trim().slice(0, maximum) : undefined
}

// Browser beacons can use this endpoint. The site key identifies a site but is not
// secret; never send passwords, tokens, IP addresses, or sensitive content.
export async function POST(request: Request) {
  let input: ActivityInput
  try { input = JSON.parse(await request.text()) } catch { return NextResponse.json({ error: 'Invalid activity payload.' }, { status: 400 }) }
  const siteKey = value(input.siteKey, 64); const event = value(input.event, 30)
  if (!siteKey || !event || !eventTypes.has(event)) return NextResponse.json({ error: 'Invalid site or event.' }, { status: 400 })
  const db = getAdminSupabase()
  const { data: site } = await db.from('sites').select('id').eq('tracking_key', siteKey).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Unknown site.' }, { status: 404 })
  const userEmail = value(input.userEmail, 320)?.toLowerCase()
  const { error } = await db.from('site_activity').insert({ site_id: site.id, event_type: event, anonymous_id: value(input.anonymousId, 128), user_email: userEmail, path: value(input.path, 500) })
  if (error) return NextResponse.json({ error: 'Could not record activity.' }, { status: 500 })
  // Keeps the site_users roster current even after old site_activity rows age out.
  if (event === 'signed_in' && userEmail) await db.rpc('record_site_sign_in', { p_site_id: site.id, p_email: userEmail })
  return new NextResponse(null, { status: 204 })
}
