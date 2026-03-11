import { createClient as createBrowserSupabase } from '@supabase/supabase-js'

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  return url
}

function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return key
}

// Lazy singleton — created on first use to avoid module-load errors during build
let _supabase: ReturnType<typeof createBrowserSupabase> | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserSupabase(getSupabaseUrl(), getSupabaseAnonKey())
  }
  return _supabase
}

// Re-export as supabase using a getter so it stays lazy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getSupabase() as any)[prop]
  },
})

// Service-role client used ONLY in server actions / API routes
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return createBrowserSupabase(getSupabaseUrl(), getSupabaseAnonKey())
  }
  return createBrowserSupabase(getSupabaseUrl(), serviceKey, {
    auth: { persistSession: false },
  })
}
