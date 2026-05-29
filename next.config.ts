import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },

  experimental: {
    optimizePackageImports: ['gsap'],
  },

  // Turbopack is the default bundler in Next.js 16
  turbopack: {},
};

export default nextConfig;
