/**
 * Pyodide Python WASM Runner
 * Lazy-loads Pyodide and runs Python code in a Web Worker
 */

let pyodideReady = false
let pyodideInstance: any = null

/**
 * Initialize Pyodide (lazy load)
 */
async function initPyodide() {
  if (pyodideReady) return pyodideInstance

  try {
    const { loadPyodide } = await import('pyodide')
    pyodideInstance = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
    })
    pyodideReady = true
    return pyodideInstance
  } catch (err) {
    console.error('Failed to load Pyodide:', err)
    throw new Error('Could not load Python environment')
  }
}

/**
 * Run Python code with timeout
 */
export async function runPython(
  code: string,
  timeoutMs: number = 10000
): Promise<{
  stdout: string
  stderr: string
  compileError: string | null
  timedOut: boolean
  executionMs: number
}> {
  const startTime = performance.now()
  const output: string[] = []
  const errors: string[] = []

  try {
    const pyodide = await initPyodide()

    // Wire stdout/stderr capture — must be set per run since buffers are fresh each call
    pyodide.setStdout({ batched: (msg: string) => output.push(msg) })
    pyodide.setStderr({ batched: (msg: string) => errors.push(msg) })

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
    )

    try {
      // Run code with timeout
      const result = await Promise.race([
        (async () => {
          try {
            await pyodide.runPythonAsync(code)
            return {
              stdout: output.join('\n'),
              stderr: errors.join('\n'),
              compileError: null,
              timedOut: false,
            }
          } catch (err) {
            return {
              stdout: output.join('\n'),
              stderr: errors.join('\n'),
              compileError: err instanceof Error ? err.message : String(err),
              timedOut: false,
            }
          }
        })(),
        timeoutPromise,
      ])

      const executionMs = Math.round(performance.now() - startTime)
      return { ...result, executionMs }
    } catch (err) {
      if (err instanceof Error && err.message === 'Execution timeout') {
        return {
          stdout: output.join('\n'),
          stderr: errors.join('\n'),
          compileError: 'Execution timeout (10s limit exceeded)',
          timedOut: true,
          executionMs: timeoutMs,
        }
      }
      throw err
    }
  } catch (err) {
    console.error('Python execution error:', err)
    const executionMs = Math.round(performance.now() - startTime)
    return {
      stdout: '',
      stderr: err instanceof Error ? err.message : String(err),
      compileError: err instanceof Error ? err.message : 'Unknown error',
      timedOut: false,
      executionMs,
    }
  }
}
