import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Webpack instead of Turbopack
  // In Next.js 16, Turbopack is default but can cause workspace issues
};

export default nextConfig;
