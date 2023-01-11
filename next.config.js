/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ALCHEMY_ID: 'API_KEY',
  }
}

module.exports = nextConfig
