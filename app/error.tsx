'use client'

import { useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0d1117]">
      <Card className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="font-syne text-3xl font-bold text-[#e6edf3] mb-2">Something went wrong</h1>
        <p className="text-[#8b949e] mb-6">
          An unexpected error occurred. You can try again, or head back to the dashboard.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
            Dashboard
          </Button>
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </Card>
    </div>
  )
}
