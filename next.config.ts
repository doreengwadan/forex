/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/avatars/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/avatars/**',
      },
    ],
    // Optional: disable image optimization for external images
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;