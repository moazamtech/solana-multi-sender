import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows all HTTPS images
      },
      {
        protocol: 'http',
        hostname: '**', // Allows all HTTP images (optional, not recommended for security reasons)
      },
    ],
  },
}

export default nextConfig