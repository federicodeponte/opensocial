// ABOUTME: Type-safe environment variable validation using Zod
// ABOUTME: Ensures all required environment variables are present and valid at runtime

import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validates and parses environment variables
 * Throws error if validation fails
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

// Validate on module load
export const env = validateEnv()

/**
 * Type-safe getter for environment variables
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  return env[key]
}
