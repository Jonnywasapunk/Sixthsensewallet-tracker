import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages are force-dynamic per-route; keep the build lean.
  reactStrictMode: true,
};

export default nextConfig;
