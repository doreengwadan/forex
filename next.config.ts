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
      // Add patterns for production domains
      {
        protocol: 'https',
        hostname: '**.vercel.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.https://limitless-trading.vercel.app/', // Replace with your actual domain
        pathname: '/**',
      },
    ],
    // Disable image optimization for development only
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Add trailing slash handling
  trailingSlash: false,
  
  // Ensure proper asset prefix (remove if not needed)
  // assetPrefix: '',
  
  // Configure build output
  distDir: '.next',
  
  // Add production source maps (optional)
  productionBrowserSourceMaps: false,
  
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
    ];
  },
  
  // Configure redirects if needed
  async redirects() {
    return [
      // Add any redirects here
      // Example: 
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ];
  },
  
  // Configure rewrites if needed (for API proxying)
  async rewrites() {
    return [
      // Add any rewrites here
      // Example for API proxy:
      // {
      //   source: '/api/:path*',
      //   destination: `${process.env.API_URL || 'http://localhost:8000/api'}/:path*`,
      // },
    ];
  },
};

module.exports = nextConfig;