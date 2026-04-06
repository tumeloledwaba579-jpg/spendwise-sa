/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['localhost'],
  },
  // Enable Turbopack optimizations
  experimental: {
    optimizePackageImports: [
      'recharts',
      '@phosphor-icons/react',
      'date-fns',
    ],
    turbopackMemoryLimit: 5096,
  },
};

module.exports = nextConfig;