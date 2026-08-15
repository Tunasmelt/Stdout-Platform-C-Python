// navigator.onLine reports link-layer connectivity, not actual internet
// access (offline-sync.md's own documented gotcha) — a laptop connected to a
// dead Wi-Fi router still reports online. Pair it with a real health check.

const CHECK_INTERVAL_MS = 15_000
const CHECK_TIMEOUT_MS = 3_000

let cachedResult: boolean | null = null
let lastCheckedAt = 0

export async function isReallyOnline(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    cachedResult = false
    lastCheckedAt = Date.now()
    return false
  }

  const now = Date.now()
  if (cachedResult !== null && now - lastCheckedAt < CHECK_INTERVAL_MS) {
    return cachedResult
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    cachedResult = response.ok
  } catch {
    cachedResult = false
  }

  lastCheckedAt = now
  return cachedResult
}

export function subscribeToNetworkEvents(onChange: (online: boolean) => void): () => void {
  const handleOnline = () => onChange(true)
  const handleOffline = () => onChange(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
