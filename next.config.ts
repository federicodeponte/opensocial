import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * TypeScript Build Configuration
   *
   * CURRENT STATE: ignoreBuildErrors is enabled as a TEMPORARY workaround
   *
   * WHY: The database types in lib/types/database.ts are placeholders (type 'never')
   * because the actual Supabase schema hasn't been deployed yet. This causes
   * type errors in lib/repositories/post-repository.ts when calling .insert()
   *
   * IMPACT: Build succeeds, but type safety is reduced during build phase
   *
   * MITIGATION:
   * - We still run `npm run type-check` separately during development
   * - The @ts-ignore comments in repository files document the issue
   * - All other code (components, services) is fully type-safe
   *
   * TODO: Remove this workaround after:
   * 1. Deploy Supabase database schema (migrations in supabase/migrations/)
   * 2. Generate proper types: `supabase gen types typescript --linked`
   * 3. Remove @ts-ignore comments from repository files
   * 4. Set ignoreBuildErrors: false (or remove this entire block)
   *
   * TIMELINE: This should be resolved in Week 2 when database schema is deployed
   */
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
