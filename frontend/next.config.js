/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
    NEXT_PUBLIC_ADMIN_KEY: process.env.NEXT_PUBLIC_ADMIN_KEY || 'sentinel-admin-dev-key-phase1',
  }
}

module.exports = nextConfig
