import { create } from 'zustand'

interface OfflineState {
  isOnline: boolean
  pendingSyncCount: number
  lastSyncedAt: number | null
  setOnline: (online: boolean) => void
  setPendingSyncCount: (count: number) => void
  setLastSyncedAt: (timestamp: number) => void
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSyncCount: 0,
  lastSyncedAt: null,
  setOnline: (isOnline) => set({ isOnline }),
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}))
