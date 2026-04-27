/** @type {import('next').NextConfig} */

// Direct proxy to Koyeb backend
const BACKEND_URL = "https://incredible-nonie-bmsconcept-37359733.koyeb.app";

const nextConfig = {
  // Rewrites to proxy API requests directly to Koyeb
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  
  // Image optimization settings
  images: {
    unoptimized: true,
  },
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Compress responses
  compress: true,
  
  // Production browser source maps
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
