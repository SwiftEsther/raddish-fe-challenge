/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ALCHEMY_ID: 'API_KEY',
  }
}

module.exports = nextConfig
