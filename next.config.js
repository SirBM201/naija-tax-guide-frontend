/** @type {import('next').NextConfig} */

// API Base URL - use environment variable or empty for rewrites
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const nextConfig = {
  // Rewrites to proxy API requests (helps with CORS and session cookies)
  async rewrites() {
    // If API_BASE is set, use it; otherwise use the Koyeb backend
    const target = API_BASE || "https://incredible-nonie-bmsconcept-37359733.koyeb.app";
    
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
  
  // Image optimization settings
  images: {
    unoptimized: true,
    domains: ['www.naijataxguides.com', 'api.naijataxguides.com'],
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
