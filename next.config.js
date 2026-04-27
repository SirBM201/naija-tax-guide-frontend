/** @type {import('next').NextConfig} */

const nextConfig = {
  // Rewrites to proxy API requests to Koyeb (same domain proxy)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://incredible-nonie-bmsconcept-37359733.koyeb.app/api/:path*",
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
