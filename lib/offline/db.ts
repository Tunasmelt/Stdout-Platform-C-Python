import Dexie, { type Table } from 'dexie'
import type {
  Profile,
  Track,
  Chapter,
  Lesson,
  AssessmentQuestion,
  AssessmentResult,
  StudentProgress,
  UserStats,
} from '@/types/index'

// Cached auth session for offline launches. Deliberately NOT localStorage —
// auth.md's "don't store JWTs in localStorage" rule is about not duplicating
// the cookie-based session Supabase SSR already manages; this is a distinct,
// IndexedDB-backed cache for when there's no network to reach cookies' server
// counterpart at all, per offline-sync.md.
export interface CachedSession {
  id: 'current'
  accessToken: string
  refreshToken: string
  expiresAt: number
  profile: Profile
}

export type SyncTable = 'assessment_results' | 'student_progress' | 'user_stats'
export type SyncOp = 'upsert'

export interface SyncQueueItem {
  id?: number
  table: SyncTable
  op: SyncOp
  payload: Record<string, unknown>
  createdAt: number
  retryCount: number
}

class OfflineDatabase extends Dexie {
  // Read-only cache, overwritten wholesale on every successful pull
  profiles!: Table<Profile, string>
  tracks!: Table<Track, string>
  chapters!: Table<Chapter, string>
  lessons!: Table<Lesson, string> // solution_code is never part of this type — see types/index.ts
  assessmentQuestions!: Table<AssessmentQuestion, string> // correct is never part of this type

  // Local + queued — written immediately, pushed via sync_queue
  assessmentResults!: Table<AssessmentResult, string>
  studentProgress!: Table<StudentProgress, string>
  userStats!: Table<UserStats, string>

  // Local only
  session!: Table<CachedSession, string>
  syncQueue!: Table<SyncQueueItem, number>

  constructor() {
    super('codelearn-offline')

    // Dexie schema versioning follows the same append-only discipline as
    // Supabase migrations (CLAUDE.md) — never edit this version's stores,
    // only add a new .version() with an upgrade function.
    this.version(1).stores({
      profiles: 'id',
      tracks: 'id, slug',
      chapters: 'id, track_id',
      lessons: 'id, chapter_id, order_index',
      assessmentQuestions: 'id, track_id',
      assessmentResults: 'id, [user_id+track_id]',
      studentProgress: 'id, [user_id+lesson_id]',
      userStats: 'user_id',
      session: 'id',
      syncQueue: '++id, table, createdAt',
    })
  }
}

export const offlineDb = new OfflineDatabase()
