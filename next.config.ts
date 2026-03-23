import type { NextConfig } from "next";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://incredible-nonie-bmsconcept-37359733.koyeb.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;