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
  webpack: (config) => {
    // pyodide.mjs references node-fetch for its Node.js fallback path, which
    // webpack tries to statically resolve on both the server and client
    // bundles even though that branch never actually runs (browsers have
    // native fetch; this project's Node runtime is 18+, which also does).
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'node-fetch': false,
    }
    return config
  },
}

module.exports = nextConfig
