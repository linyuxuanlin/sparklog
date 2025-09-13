/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // We are building a client-driven SPA on top of Next static export
  },
}

module.exports = nextConfig
