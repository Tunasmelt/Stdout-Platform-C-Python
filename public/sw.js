// CodeLearn service worker — app-shell + visited-lesson + WASM asset caching.
//
// Hand-rolled (no next-pwa) to avoid adding a dependency that needs approval
// per CLAUDE.md's package rule; offline-sync.md explicitly offers a plain
// service worker as the alternative to a next-pwa config.
//
// Scope is deliberately conservative: this caches assets for offline reuse.
// It does NOT register a web app manifest or make the app "installable" —
// that's a separate, still-open decision (CLAUDE.md) involving icons/
// branding this file has no business deciding on its own.

const CACHE_NAME = 'codelearn-v1'
const PYODIDE_CACHE_NAME = 'codelearn-pyodide-v1'
const PYODIDE_HOSTS = ['cdn.jsdelivr.net']

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== PYODIDE_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Pyodide CDN assets — versioned by URL (e.g. /v0.25.0/), safe to cache
  // indefinitely. This is what lets a *repeat* offline session skip
  // re-downloading the Python runtime.
  if (PYODIDE_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, PYODIDE_CACHE_NAME))
    return
  }

  // Next.js build assets — content-hashed filenames, immutable.
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, CACHE_NAME))
    return
  }

  // Page navigations: network-first, falling back to the last cached version
  // of that exact URL. This is what "cache-on-visit" means here — a lesson
  // page is only available offline after it's actually been opened once
  // while online, not pre-cached for the whole catalog up front.
  if (url.origin === self.location.origin && request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE_NAME))
    return
  }
})

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (err) {
    if (cached) return cached
    throw err
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return cached
    throw err
  }
}
