import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['md-to-pdf', 'puppeteer'],
};

export default nextConfig;
