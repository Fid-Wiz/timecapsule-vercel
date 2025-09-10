import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint at build time (we’ll re-enable after the hackathon)
  eslint: { ignoreDuringBuilds: true },
  // (Optional) If TypeScript errors pop up during a prod build, uncomment next line:
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
