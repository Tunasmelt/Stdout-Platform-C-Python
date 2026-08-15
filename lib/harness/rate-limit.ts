// In-memory, per-instance rate limiter for the execution harness.
//
// The harness has no database (and per CLAUDE.md's rules, never should — it
// must stay stateless in/stateless out), so this can't be a real distributed
// limiter. Serverless functions can run as multiple concurrent instances, each
// with its own copy of this Map, so a determined caller spread across
// instances could exceed the nominal limit. This is a best-effort throttle
// against casual abuse, not a hard guarantee — a production deployment
// wanting real limits would put this behind a platform-level limiter (e.g.
// Vercel's edge config / WAF) instead of relying on in-process state.

interface Bucket {
  count: number
  windowStart: number
}

const buckets = new Map<string, Bucket>()

const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 10
const MAX_TRACKED_KEYS = 5000

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()

  // Opportunistic cleanup so this Map can't grow unbounded over an instance's lifetime.
  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [trackedKey, bucket] of buckets) {
      if (now - bucket.windowStart >= WINDOW_MS) buckets.delete(trackedKey)
    }
  }

  const bucket = buckets.get(key)

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now })
    return { allowed: true }
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - bucket.windowStart) }
  }

  bucket.count += 1
  return { allowed: true }
}
