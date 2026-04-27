/** @type {import('next').NextConfig} */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://incredible-nonie-bmsconcept-37359733.koyeb.app";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
  
  images: {
    unoptimized: true,
  },
  
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
