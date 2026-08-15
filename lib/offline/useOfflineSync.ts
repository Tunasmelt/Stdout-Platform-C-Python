'use client'

import { useEffect } from 'react'
import { useOfflineStore } from '@/stores/offlineStore'
import { runSync } from './sync'
import { subscribeToNetworkEvents, isReallyOnline } from './network'
import { pendingCount } from './queue'

const SYNC_INTERVAL_MS = 60_000

// Triggers per offline-sync.md: on the browser online event, on app
// focus/foreground, and on an interval while online as a safety net.
export function useOfflineSync(enabled: boolean) {
  const setOnline = useOfflineStore((s) => s.setOnline)
  const setPendingSyncCount = useOfflineStore((s) => s.setPendingSyncCount)
  const setLastSyncedAt = useOfflineStore((s) => s.setLastSyncedAt)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const refreshPendingCount = async () => {
      const count = await pendingCount()
      if (!cancelled) setPendingSyncCount(count)
    }

    const trySync = async () => {
      const online = await isReallyOnline()
      if (cancelled) return
      setOnline(online)
      if (!online) return

      const result = await runSync()
      if (cancelled) return
      if (result.pushed > 0 || result.pulled) {
        setLastSyncedAt(Date.now())
      }
      await refreshPendingCount()
    }

    refreshPendingCount()
    trySync()

    const unsubscribe = subscribeToNetworkEvents((online) => {
      setOnline(online)
      if (online) trySync()
    })

    const interval = setInterval(trySync, SYNC_INTERVAL_MS)
    const handleFocus = () => trySync()
    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      unsubscribe()
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled, setOnline, setPendingSyncCount, setLastSyncedAt])
}
