import type { NextConfig } from "next";

// For local development - use your local backend if running
// For production - use empty string so rewrites handle it
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const nextConfig: NextConfig = {
  // Rewrites to proxy API requests (helps with CORS and session cookies)
  async rewrites() {
    // If API_BASE is set, use it; otherwise use the production backend
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

export default nextConfig;
