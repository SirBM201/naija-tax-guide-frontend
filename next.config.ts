import type { NextConfig } from "next";

// API Base URL - use environment variable or fallback to Koyeb
// After DNS propagates, you can change this to use the env var
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 
  "https://incredible-nonie-bmsconcept-37359733.koyeb.app";

const nextConfig: NextConfig = {
  // Rewrites to proxy API requests (helps with CORS and session cookies)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
  
  // Image optimization settings
  images: {
    unoptimized: true,
    domains: ['www.naijataxguides.com', 'api.naijataxguides.com'],
  },
  
  // Enable React strict mode for better development
  reactStrictMode: true,
  
  // Compress responses
  compress: true,
  
  // Production browser source maps (disable for better performance)
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
