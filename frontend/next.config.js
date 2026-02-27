/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['localhost'],
  },
  // Enable Turbopack optimizations
  experimental: {
    turbo: {
      // Enable file system caching for faster restarts
      memoryLimit: 4096,
    },
    optimizePackageImports: [
      'recharts',
      '@phosphor-icons/react',
      'date-fns',
    ],
  },
};

module.exports = nextConfig;