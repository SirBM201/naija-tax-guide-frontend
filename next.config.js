/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://incredible-nonie-bmsconcept-37359733.koyeb.app/api/:path*",
      },
    ];
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  compress: true,
};

module.exports = nextConfig;
