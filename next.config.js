/** @type {import('next').NextConfig} */

// Direct proxy to Koyeb backend - no environment variable needed
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
    domains: ['www.naijataxguides.com'],
  },
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Compress responses
  compress: true,
  
  // Production browser source maps
  productionBrowserSourceMaps: false,
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
