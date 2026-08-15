import { offlineDb, type CachedSession } from './db'
import type { Profile } from '@/types/index'

export async function cacheSession(params: {
  accessToken: string
  refreshToken: string
  expiresAt: number
  profile: Profile
}): Promise<void> {
  await offlineDb.session.put({ id: 'current', ...params })
}

export async function getCachedSession(): Promise<CachedSession | undefined> {
  return offlineDb.session.get('current')
}

export async function clearCachedSession(): Promise<void> {
  await offlineDb.session.delete('current')
}

export function isSessionExpired(session: CachedSession): boolean {
  return Date.now() >= session.expiresAt
}
