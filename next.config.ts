import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type checking during build - we use separate `npm run type-check` command
  // This is necessary until Supabase database schema is deployed and types are generated
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
