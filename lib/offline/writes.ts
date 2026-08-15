import { offlineDb } from './db'
import { enqueueWrite } from './queue'
import type { StudentProgress } from '@/types/index'

/**
 * Save a lesson attempt (attempts count + last_code) to the local cache
 * immediately, then queue it for push. Deliberately never writes `completed`
 * or triggers XP — that requires server-side verification against
 * expected_output (see app/api/progress/update/route.ts), which can't happen
 * offline. offline-sync.md's generic "every write goes local-first" guidance
 * doesn't account for that later security fix; this is the resolution.
 */
export async function saveProgressAttemptLocally({
  userId,
  lessonId,
  lastCode,
}: {
  userId: string
  lessonId: string
  lastCode: string
}): Promise<void> {
  const existing = await offlineDb.studentProgress
    .where('[user_id+lesson_id]')
    .equals([userId, lessonId])
    .first()

  const row: StudentProgress = existing
    ? { ...existing, attempts: existing.attempts + 1, last_code: lastCode }
    : {
        id: crypto.randomUUID(),
        user_id: userId,
        lesson_id: lessonId,
        completed: false,
        attempts: 1,
        last_code: lastCode,
        completed_at: null,
        created_at: new Date().toISOString(),
      }

  await offlineDb.studentProgress.put(row)

  // Payload intentionally omits `completed`/`completed_at` — Supabase's
  // upsert only updates the columns present in the payload, so a server-side
  // completed:true is never clobbered by this queued write.
  await enqueueWrite('student_progress', 'upsert', {
    id: row.id,
    user_id: row.user_id,
    lesson_id: row.lesson_id,
    attempts: row.attempts,
    last_code: row.last_code,
  })
}
