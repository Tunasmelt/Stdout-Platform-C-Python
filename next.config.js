/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Set to false only if you want to bypass type checking during builds
    tsconfigPath: './tsconfig.json',
  },
  experimental: {
    typedRoutes: true,
  },
}

module.exports = nextConfig
