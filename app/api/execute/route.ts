import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/harness/rate-limit'
import type { ExecuteRequest, ExecuteResponse } from '@/types/index'

// Deliberately Node.js, not Edge: any real sandboxed executor added later
// (e.g. isolated-vm for the TypeScript case) needs Node APIs / native addons
// that the Edge runtime can't load.
export const runtime = 'nodejs'

const SUPPORTED_LANGUAGES = ['python', 'typescript', 'c', 'cpp'] as const
const DEFAULT_TIMEOUT_MS = 10_000
const MAX_TIMEOUT_MS = 10_000

function isSupportedLanguage(value: unknown): value is ExecuteRequest['language'] {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { allowed, retryAfterMs } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — try again shortly' },
      {
        status: 429,
        headers: retryAfterMs ? { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } : undefined,
      }
    )
  }

  let body: Partial<ExecuteRequest>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { language, code, timeoutMs } = body

  if (!isSupportedLanguage(language)) {
    return NextResponse.json(
      { error: `Unsupported language. Expected one of: ${SUPPORTED_LANGUAGES.join(', ')}` },
      { status: 400 }
    )
  }
  if (typeof code !== 'string') {
    return NextResponse.json({ error: 'code must be a string' }, { status: 400 })
  }

  const effectiveTimeoutMs = Math.min(
    typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
    MAX_TIMEOUT_MS
  )

  const startedAt = Date.now()

  // Server-side timeout enforcement — real even though nothing is sandboxed
  // yet. This Promise.race is what will bound actual execution once a real
  // executor is wired in; it isn't decorative scaffolding.
  //
  // No executor is wired in for any language yet. Per harness.md's "Runtime
  // choice", Python/C/C++ need OS/container-level isolation (seccomp, chroot,
  // or a container/microVM per execution) that a standard serverless function
  // doesn't have the privileges to provide — there's no library equivalent to
  // isolated-vm for arbitrary interpreters/compilers. Sandboxing the
  // TypeScript-only case via isolated-vm was deliberately deferred (it's a
  // native addon that can't be installed or verified in this environment),
  // not silently skipped. This endpoint validates, rate-limits, and enforces
  // the timeout contract now, ready for a real executor to be dropped in.
  const executePromise = (async (): Promise<ExecuteResponse> => ({
    stdout: '',
    stderr: '',
    compileError:
      'The execution harness is not connected to a sandboxed runtime yet — see harness.md. ' +
      'This endpoint validates requests, rate-limits, and enforces the timeout contract, but does not run code.',
    exitCode: null,
    timedOut: false,
    executionMs: 0,
  }))()

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('harness-timeout')), effectiveTimeoutMs)
  )

  try {
    const result = await Promise.race([executePromise, timeoutPromise])
    return NextResponse.json({ ...result, executionMs: Date.now() - startedAt } satisfies ExecuteResponse)
  } catch {
    const response: ExecuteResponse = {
      stdout: '',
      stderr: '',
      compileError: `Execution timeout (${effectiveTimeoutMs}ms limit exceeded)`,
      exitCode: null,
      timedOut: true,
      executionMs: Date.now() - startedAt,
    }
    return NextResponse.json(response)
  }
}
