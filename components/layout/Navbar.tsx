'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useOfflineStore } from '@/stores/offlineStore'
import { useOfflineSync } from '@/lib/offline/useOfflineSync'
import { clearCachedSession } from '@/lib/offline/session'

export const Navbar = ({ user }: { user?: User | null }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isOnline = useOfflineStore((s) => s.isOnline)
  const pendingSyncCount = useOfflineStore((s) => s.pendingSyncCount)

  useOfflineSync(!!user)

  const handleLogout = async () => {
    setIsLoading(true)
    // Clear the local session immediately regardless of network — a stale
    // server-side session isn't security-critical here (offline-sync.md), so
    // logout must not hang waiting on a sign-out call that can't complete offline.
    await clearCachedSession()
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // Best-effort — already logged out locally.
    }
    router.push('/')
  }

  return (
    <nav className="bg-[#0d1117] border-b border-[#30363d] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold font-syne text-[#f78166]">CodeLearn</span>
          </Link>

          <div className="flex gap-2 sm:gap-4 items-center min-w-0">
            {user && !isOnline && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2d1b00] border border-[#9e6a03] rounded-full text-xs text-[#e3b341]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e3b341]" />
                Offline{pendingSyncCount > 0 ? ` · ${pendingSyncCount} pending` : ''}
              </span>
            )}
            {user ? (
              <>
                <span className="hidden sm:inline text-[#8b949e] text-sm truncate max-w-[12rem]">
                  {user.email}
                </span>
                <Button
                  onClick={handleLogout}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? 'Signing out...' : 'Sign out'}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
