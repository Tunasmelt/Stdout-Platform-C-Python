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
  async headers() {
    return [
      {
        // Scoped to just the lesson route, not site-wide: @wasmer/sdk needs
        // cross-origin isolation (SharedArrayBuffer) to run C/C++. COEP
        // require-corp can silently break cross-origin subresources that
        // don't send a matching CORP/CORS header, so this stays off every
        // other route (auth, dashboard, admin) rather than risk that
        // everywhere at once.
        source: '/tracks/:track/lesson/:lesson',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
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
