import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  const contents = readFileSync(envPath, 'utf8')

  for (const line of contents.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex)
    const rawValue = trimmed.slice(separatorIndex + 1)
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    process.env[key] = value
  }
}

loadEnvLocal()

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or key in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const { data, error } = await supabase
  .from('rooms')
  .select('id, status, clue, storyteller_id, updated_at')
  .order('updated_at', { ascending: false })
  .limit(10)

if (error) {
  console.error('Supabase connection failed')
  console.error(error)
  process.exit(1)
}

console.log('Supabase connection succeeded')
console.table(data ?? [])
