'use client'

import { useEffect } from 'react'

// Registered app-wide (not just for logged-in students) — app-shell caching
// benefits an anonymous visitor revisiting the landing page too.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err)
      })
    }
  }, [])

  return null
}
