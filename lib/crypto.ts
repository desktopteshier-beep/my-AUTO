import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { getAdminSupabase } from '@/lib/supabase'

// Encrypts secrets (external project service role keys) before they touch the
// database. The encryption passphrase is auto-generated on first use and
// stored in app_secrets, so there's no manual setup step. Set
// CONNECTION_KEY_SECRET yourself only if you'd rather manage it externally —
// it takes priority over the stored one when present.
let cachedSecret: string | null = null

async function getConnectionSecret() {
  if (process.env.CONNECTION_KEY_SECRET) return process.env.CONNECTION_KEY_SECRET
  if (cachedSecret) return cachedSecret
  const db = getAdminSupabase()

  const { data: existing, error: readError } = await db.from('app_secrets').select('value').eq('key', 'connection_key_secret').maybeSingle()
  if (readError) throw new Error(readError.code === '42P01' ? 'Missing app_secrets table — run migration 202607270004_app_secrets.sql.' : readError.message)
  if (existing) { cachedSecret = existing.value as string; return cachedSecret }

  const generated = randomBytes(32).toString('base64')
  const { error: insertError } = await db.from('app_secrets').insert({ key: 'connection_key_secret', value: generated })
  if (insertError && insertError.code !== '23505') throw new Error(insertError.message) // 23505 = another request won the race to create it first

  const { data: winner, error: rereadError } = await db.from('app_secrets').select('value').eq('key', 'connection_key_secret').single()
  if (rereadError || !winner) throw new Error(rereadError?.message ?? 'Could not read the connection secret.')
  cachedSecret = winner.value as string
  return cachedSecret
}

async function deriveKey() {
  const secret = await getConnectionSecret()
  return scryptSync(secret, 'portfolio-control-plane', 32)
}

export async function encryptSecret(plain: string) {
  const key = await deriveKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv, authTag, ciphertext].map(buffer => buffer.toString('base64')).join(':')
}

export async function decryptSecret(payload: string) {
  const [ivB64, authTagB64, ciphertextB64] = payload.split(':')
  if (!ivB64 || !authTagB64 || !ciphertextB64) throw new Error('Malformed encrypted payload.')
  const key = await deriveKey()
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()]).toString('utf8')
}
