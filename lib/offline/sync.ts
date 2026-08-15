import { createClient } from '@/lib/supabase/client'
import { offlineDb } from './db'
import { getQueuedWrites, removeQueuedWrite, incrementRetry } from './queue'
import { isReallyOnline } from './network'
import type { SyncTable } from './db'
import type { Lesson, AssessmentQuestion } from '@/types/index'

const MAX_RETRIES = 5

const CONFLICT_TARGETS: Record<SyncTable, string> = {
  assessment_results: 'user_id,track_id',
  student_progress: 'user_id,lesson_id',
  user_stats: 'user_id',
}

function backoffMs(retryCount: number): number {
  return Math.min(1000 * 2 ** retryCount, 30_000)
}

export interface SyncResult {
  pushed: number
  failedPermanently: number
  pulled: boolean
}

// Module-level guard, not per-call — a second concurrent runSync() (e.g. the
// interval timer firing while a focus-triggered sync is still in flight)
// should no-op rather than race the same queue.
let isSyncing = false

export async function runSync(): Promise<SyncResult> {
  if (isSyncing) {
    return { pushed: 0, failedPermanently: 0, pulled: false }
  }
  isSyncing = true

  try {
    const online = await isReallyOnline()
    if (!online) {
      return { pushed: 0, failedPermanently: 0, pulled: false }
    }

    const pushResult = await pushQueue()
    const pulled = await pullFreshCache()

    return { ...pushResult, pulled }
  } finally {
    isSyncing = false
  }
}

async function pushQueue(): Promise<{ pushed: number; failedPermanently: number }> {
  const supabase = createClient()
  const items = await getQueuedWrites()

  let pushed = 0
  let failedPermanently = 0

  for (const item of items) {
    if (item.id === undefined) continue

    if (item.retryCount >= MAX_RETRIES) {
      failedPermanently++
      continue
    }

    const readyAt = item.createdAt + backoffMs(item.retryCount)
    if (item.retryCount > 0 && Date.now() < readyAt) {
      continue // still backing off — try again on the next sync pass
    }

    try {
      const { error } = await supabase
        .from(item.table)
        .upsert(item.payload, { onConflict: CONFLICT_TARGETS[item.table] })

      if (error) throw error

      await removeQueuedWrite(item.id)
      pushed++
    } catch {
      await incrementRetry(item.id)
    }
  }

  return { pushed, failedPermanently }
}

// Read-only catalog data (tracks/chapters/published lessons/questions) is
// small and shared, so this pulls everything rather than scoping to "the
// student's tracks" — simpler, and RLS already governs what's actually
// visible, so there's no over-exposure from fetching more than strictly
// necessary.
async function pullFreshCache(): Promise<boolean> {
  const supabase = createClient()

  try {
    const [{ data: tracks }, { data: chapters }, { data: lessons }, { data: questions }] =
      await Promise.all([
        supabase.from('tracks').select('id, slug, title, description, icon, created_at'),
        supabase.from('chapters').select('id, track_id, title, order_index, created_at'),
        supabase
          .from('lessons')
          // solution_code deliberately excluded — never cached locally, same rule as the server
          .select(
            'id, chapter_id, title, slug, content_md, exercise_md, starter_code, expected_output, difficulty, order_index, is_published, created_at'
          )
          .eq('is_published', true),
        supabase
          .from('assessment_questions')
          // correct deliberately excluded — never cached locally, same rule as the server
          .select('id, track_id, question, options, difficulty, order_index'),
      ])

    await offlineDb.transaction(
      'rw',
      [offlineDb.tracks, offlineDb.chapters, offlineDb.lessons, offlineDb.assessmentQuestions],
      async () => {
        if (tracks) {
          await offlineDb.tracks.clear()
          await offlineDb.tracks.bulkPut(tracks)
        }
        if (chapters) {
          await offlineDb.chapters.clear()
          await offlineDb.chapters.bulkPut(chapters)
        }
        if (lessons) {
          await offlineDb.lessons.clear()
          await offlineDb.lessons.bulkPut(lessons as unknown as Lesson[])
        }
        if (questions) {
          await offlineDb.assessmentQuestions.clear()
          await offlineDb.assessmentQuestions.bulkPut(questions as unknown as AssessmentQuestion[])
        }
      }
    )

    return true
  } catch {
    return false
  }
}
