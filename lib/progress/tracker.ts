import { createClient } from '@/lib/supabase/server'

/**
 * Track student progress: update attempts, save code, mark completion
 */
export async function updateLessonProgress({
  userId,
  lessonId,
  lastCode,
  completed = false,
}: {
  userId: string
  lessonId: string
  lastCode?: string
  completed?: boolean
}) {
  const supabase = await createClient()

  try {
    // Get existing progress or create new one
    const { data: existing } = await supabase
      .from('student_progress')
      .select('id, attempts, completed, completed_at')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (existing) {
      // Completion only ever moves false -> true here — a non-passing re-run
      // must not un-complete a lesson that was already finished.
      const finalCompleted = completed || existing.completed || false

      // Update existing record
      const { error } = await supabase
        .from('student_progress')
        .update({
          attempts: (existing.attempts || 0) + 1,
          last_code: lastCode || undefined,
          completed: finalCompleted,
          completed_at: finalCompleted ? existing.completed_at ?? new Date().toISOString() : undefined,
        })
        .eq('id', existing.id)

      if (error) throw error
      return { success: true, isNew: false }
    } else {
      // Create new progress record
      const { error } = await supabase
        .from('student_progress')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          attempts: 1,
          last_code: lastCode,
          completed,
          completed_at: completed ? new Date().toISOString() : undefined,
        })

      if (error) throw error
      return { success: true, isNew: true }
    }
  } catch (err) {
    console.error('Error updating progress:', err)
    throw err
  }
}

/**
 * Mark a lesson as complete and grant XP — idempotent. XP is only awarded the
 * first time a lesson transitions to completed; re-running already-passing
 * code (or re-submitting) must not farm XP.
 */
export async function completeLessonWithXP({
  userId,
  lessonId,
  lastCode,
  xpReward = 100,
}: {
  userId: string
  lessonId: string
  lastCode?: string
  xpReward?: number
}) {
  const supabase = await createClient()

  try {
    const { data: existing } = await supabase
      .from('student_progress')
      .select('completed')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    const alreadyCompleted = existing?.completed ?? false

    await updateLessonProgress({ userId, lessonId, lastCode, completed: true })

    if (alreadyCompleted) {
      return { success: true, xpAwarded: 0 }
    }

    const { data: stats } = await supabase
      .from('user_stats')
      .select('xp')
      .eq('user_id', userId)
      .maybeSingle()

    const currentXp = stats?.xp ?? 0
    await supabase
      .from('user_stats')
      .update({ xp: currentXp + xpReward })
      .eq('user_id', userId)

    return { success: true, xpAwarded: xpReward }
  } catch (err) {
    console.error('Error completing lesson:', err)
    throw err
  }
}

/**
 * Record a day of activity for streak purposes. Same-day calls are a no-op;
 * a gap of exactly one day extends the streak; any larger gap resets it to 1.
 */
export async function recordDailyActivity({ userId }: { userId: string }) {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: stats } = await supabase
    .from('user_stats')
    .select('streak_days, last_active')
    .eq('user_id', userId)
    .maybeSingle()

  if (!stats) {
    return { streakDays: 0 }
  }

  if (stats.last_active === today) {
    return { streakDays: stats.streak_days ?? 1 }
  }

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  const newStreak = stats.last_active === yesterday ? (stats.streak_days ?? 0) + 1 : 1

  await supabase
    .from('user_stats')
    .update({ streak_days: newStreak, last_active: today })
    .eq('user_id', userId)

  return { streakDays: newStreak }
}

/**
 * Get student progress for a specific lesson
 */
export async function getProgressForLesson({
  userId,
  lessonId,
}: {
  userId: string
  lessonId: string
}) {
  const supabase = await createClient()

  try {
    const { data } = await supabase
      .from('student_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    return data || null
  } catch (err) {
    console.error('Error fetching progress:', err)
    return null
  }
}
