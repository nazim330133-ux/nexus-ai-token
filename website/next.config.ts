import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
