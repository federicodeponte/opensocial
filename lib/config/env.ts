// ABOUTME: Type-safe environment variable validation using Zod
// ABOUTME: Ensures all required environment variables are present and valid at runtime

import { z } from 'zod'

/**
 * Client-side environment variables (NEXT_PUBLIC_*)
 * These are available in both server and client contexts
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
})

/**
 * Server-side environment variables
 * These are ONLY available in server contexts (API routes, server components)
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

/**
 * Validates client-side environment variables
 * Safe to call in both server and client contexts
 */
function validateClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    // Using console.error here is intentional - this runs before logger is initialized
    // and we need immediate feedback for misconfigured environments
    console.error('❌ Invalid client environment variables:', errors)
    throw new Error(
      `Invalid client environment variables: ${Object.keys(errors).join(', ')}`
    )
  }

  return parsed.data
}

/**
 * Validates server-side environment variables
 * Should ONLY be called in server contexts (will fail on client)
 */
function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    console.error('❌ Invalid server environment variables:', errors)
    throw new Error(
      `Invalid server environment variables: ${Object.keys(errors).join(', ')}`
    )
  }

  return parsed.data
}

// Lazy evaluation - only validate when accessed
let clientEnvCache: ClientEnv | null = null
let serverEnvCache: ServerEnv | null = null

/**
 * Get validated client environment variables
 * Safe to use in both server and client code
 */
export function getClientEnv(): ClientEnv {
  if (!clientEnvCache) {
    clientEnvCache = validateClientEnv()
  }
  return clientEnvCache
}

/**
 * Get validated server environment variables
 * ONLY use in server code (API routes, server components, middleware)
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() called in client context - this is a bug')
  }

  if (!serverEnvCache) {
    serverEnvCache = validateServerEnv()
  }
  return serverEnvCache
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use getClientEnv() or getServerEnv() instead
 */
export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getClientEnv().NEXT_PUBLIC_SUPABASE_URL
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return getClientEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return getServerEnv().SUPABASE_SERVICE_ROLE_KEY
  },
  get NODE_ENV() {
    return getServerEnv().NODE_ENV
  },
}
