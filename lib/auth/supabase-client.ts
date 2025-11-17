// ABOUTME: Client-side Supabase client for use in Client Components
// ABOUTME: Uses browser storage for session management

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/types/database'

export function createClient() {
  // Access environment variables from window for client-side
  // These are injected by Next.js at build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
