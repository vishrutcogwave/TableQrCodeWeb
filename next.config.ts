import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds even if there are ESLint issues. Warnings still show in output.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
