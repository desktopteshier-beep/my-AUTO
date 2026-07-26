import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function getAdminSupabase() {
  if (!url || !serviceKey) throw new Error('Missing Supabase server environment variables')
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export function getPublicSupabase() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Missing Supabase public environment variables')
  return createClient(url, anonKey)
}
