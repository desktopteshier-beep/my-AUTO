import { createClient } from '@supabase/supabase-js'
import { decryptSecret } from '@/lib/crypto'

export type ExternalUser = { id: string; email: string | null; createdAt: string; lastSignInAt: string | null }

type Connection = { external_supabase_url: string | null; external_service_role_key_enc: string | null }

// Pages through that project's own Supabase Auth via the Admin API, using the
// service role key it was connected with. Requires that project to actually
// use Supabase Auth for sign-in (the whole point of this control plane's
// manual-access model — see 202607260004_external_project_access.sql).
export async function listExternalUsers(connection: Connection): Promise<ExternalUser[]> {
  if (!connection.external_supabase_url || !connection.external_service_role_key_enc) return []
  const serviceKey = await decryptSecret(connection.external_service_role_key_enc)
  const client = createClient(connection.external_supabase_url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const users: ExternalUser[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    users.push(...data.users.map(user => ({ id: user.id, email: user.email ?? null, createdAt: user.created_at, lastSignInAt: user.last_sign_in_at ?? null })))
    if (data.users.length < 200) break
  }
  return users
}
