/**
 * C/C++ WASM Runner
 *
 * Uses @wasmer/sdk to run clang entirely in-browser, compile the student's
 * code to a WASI .wasm binary, then run that binary via the same SDK.
 * Requires the page to be cross-origin isolated (COOP/COEP — see
 * next.config.js's headers() for the lesson route) because the SDK uses
 * SharedArrayBuffer internally even for single-threaded programs.
 *
 * The SDK is loaded from jsdelivr via a webpackIgnore'd dynamic import, not
 * the npm-installed copy — its wasm-bindgen-generated bundle uses
 * `import.meta` in a way Next.js's production Terser pass can't parse
 * (a known issue with wasm-bindgen output in webpack; Wasmer's own official
 * browser example loads it from a CDN for the same reason). The npm package
 * stays a real dependency purely for type-checking (`import type` below is
 * erased at compile time, so it never reaches the bundle) and so the pinned
 * version here has something to stay in sync with.
 *
 * Live-verified in a real browser (see HANDOFF.md for the full test):
 * `language: 'c'` genuinely compiles and runs, correct stdout confirmed,
 * ~10-30s including first-time clang download. Compile errors are reported
 * correctly and fast (~300ms). `language: 'cpp'` does NOT complete within
 * 240+ seconds — #include <iostream> alone times out. This isn't a timeout
 * value to tune: no student would wait 4+ minutes for a compile. The 10s
 * default below already fails C++ safely (a clean "Execution timeout"
 * result, not a hang), so nothing here is broken — but C++ should be
 * treated as unavailable/unshippable via this toolchain until the
 * underlying libc++ linking issue is understood, not just "slow."
 */

import type * as WasmerSdk from '@wasmer/sdk'
import type { Wasmer } from '@wasmer/sdk'

const SDK_VERSION = '0.10.0'
const SDK_URL = `https://cdn.jsdelivr.net/npm/@wasmer/sdk@${SDK_VERSION}/dist/index.mjs`

// A variable (not literal) module specifier resolves to `any` for TypeScript
// no matter what — there's no way to point it at the CDN URL's types — so
// this cast recovers real types from the npm package's own .d.ts instead of
// letting everything downstream silently widen to `any`.
async function loadSdk(): Promise<typeof WasmerSdk> {
  return (await import(/* webpackIgnore: true */ SDK_URL)) as typeof WasmerSdk
}

let sdkReady = false
let clangPackage: Wasmer | null = null

async function loadClang(): Promise<Wasmer> {
  if (clangPackage) return clangPackage

  const { init, Wasmer: WasmerClass } = await loadSdk()

  if (!sdkReady) {
    await init()
    sdkReady = true
  }

  clangPackage = await WasmerClass.fromRegistry('clang/clang')
  return clangPackage
}

interface CppRunResult {
  stdout: string
  stderr: string
  compileError: string | null
  timedOut: boolean
  executionMs: number
  unavailable?: boolean
}

/**
 * Compile and run C/C++ code
 */
export async function runCppCode(
  code: string,
  language: 'c' | 'cpp' = 'c',
  timeoutMs: number = 10000
): Promise<CppRunResult> {
  const startTime = performance.now()

  let clang: Wasmer
  try {
    clang = await loadClang()
  } catch (err) {
    return {
      stdout: '',
      stderr: err instanceof Error ? err.message : String(err),
      compileError: err instanceof Error ? err.message : 'Could not load the C/C++ compiler',
      timedOut: false,
      executionMs: Math.round(performance.now() - startTime),
      unavailable: true,
    }
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
  )

  const runPromise = (async (): Promise<Omit<CppRunResult, 'executionMs'>> => {
    const { Wasmer: WasmerClass, Directory } = await loadSdk()

    if (!clang.entrypoint) {
      throw new Error('The C/C++ compiler package has no entrypoint')
    }

    const sourceFile = language === 'cpp' ? 'main.cpp' : 'main.c'
    const project = new Directory()
    await project.writeFile(sourceFile, code)

    const compileInstance = await clang.entrypoint.run({
      args: [`/project/${sourceFile}`, '-o', '/project/main.wasm'],
      mount: { '/project': project },
    })
    const compileOutput = await compileInstance.wait()

    if (!compileOutput.ok) {
      return {
        stdout: '',
        stderr: compileOutput.stderr,
        compileError: compileOutput.stderr || `clang exited with code ${compileOutput.code}`,
        timedOut: false,
      }
    }

    const wasmBytes = await project.readFile('main.wasm')
    const program = await WasmerClass.fromFile(wasmBytes)

    if (!program.entrypoint) {
      throw new Error('The compiled program has no entrypoint')
    }

    const runInstance = await program.entrypoint.run()
    const runOutput = await runInstance.wait()

    return {
      stdout: runOutput.stdout,
      stderr: runOutput.stderr,
      compileError: runOutput.ok ? null : runOutput.stderr || `Program exited with code ${runOutput.code}`,
      timedOut: false,
    }
  })()

  try {
    const result = await Promise.race([runPromise, timeoutPromise])
    return { ...result, executionMs: Math.round(performance.now() - startTime) }
  } catch (err) {
    if (err instanceof Error && err.message === 'Execution timeout') {
      return {
        stdout: '',
        stderr: '',
        compileError: 'Execution timeout (10s limit exceeded)',
        timedOut: true,
        executionMs: timeoutMs,
      }
    }
    return {
      stdout: '',
      stderr: err instanceof Error ? err.message : String(err),
      compileError: err instanceof Error ? err.message : 'Unknown error',
      timedOut: false,
      executionMs: Math.round(performance.now() - startTime),
    }
  }
}
