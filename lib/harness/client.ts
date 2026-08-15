import type { RunResult } from '@/types/index'

/**
 * Call the execution harness as a fallback when the client-side WASM runtime
 * itself couldn't load/run (RunResult.unavailable) — not for ordinary code
 * errors, which the WASM runners already report on their own.
 */
export async function runViaHarness(
  language: 'python' | 'typescript' | 'c' | 'cpp',
  code: string,
  timeoutMs = 10000
): Promise<RunResult> {
  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, timeoutMs }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        stdout: '',
        stderr: '',
        compileError: data.error || `Harness request failed (${response.status})`,
        timedOut: false,
        executionMs: 0,
      }
    }

    return {
      stdout: data.stdout ?? '',
      stderr: data.stderr ?? '',
      compileError: data.compileError ?? null,
      timedOut: !!data.timedOut,
      executionMs: data.executionMs ?? 0,
    }
  } catch (err) {
    return {
      stdout: '',
      stderr: err instanceof Error ? err.message : String(err),
      compileError: 'Could not reach the execution harness',
      timedOut: false,
      executionMs: 0,
    }
  }
}
