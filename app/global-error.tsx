'use client'

// Separate from error.tsx: this is the only boundary that catches a failure in
// the root layout itself (fonts, metadata setup). Next.js requires it to render
// its own <html>/<body> since the root layout that would normally provide them
// is what failed — kept dependency-free with inline styles for that reason.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          color: '#e6edf3',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#8b949e', marginBottom: '1.5rem' }}>
            A critical error occurred while loading the app.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#f78166',
              color: '#0d1117',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
