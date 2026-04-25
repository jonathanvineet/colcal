import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client using the service-role key.
 * Only use this server-side (in Next.js API routes).
 * The service-role key bypasses RLS — auth is enforced by Clerk in the API route.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
