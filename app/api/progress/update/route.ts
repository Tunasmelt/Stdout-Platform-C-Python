import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateLessonProgress, completeLessonWithXP, recordDailyActivity } from '@/lib/progress/tracker'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { lessonId, lastCode, stdout, hadError } = await request.json()
  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
  }

  // Pass/fail is decided here, against the server's own trusted read of
  // expected_output — the client sends its raw run output, not a verdict.
  const { data: lesson } = await supabase
    .from('lessons')
    .select('expected_output')
    .eq('id', lessonId)
    .maybeSingle()

  const expected = lesson?.expected_output?.trim()
  const passed = !!expected && !hadError && typeof stdout === 'string' && stdout.trim() === expected

  try {
    const [progressResult, activityResult] = await Promise.all([
      passed
        ? completeLessonWithXP({ userId: userData.user.id, lessonId, lastCode })
        : updateLessonProgress({ userId: userData.user.id, lessonId, lastCode }),
      recordDailyActivity({ userId: userData.user.id }),
    ])

    return NextResponse.json({ ...progressResult, streakDays: activityResult.streakDays, passed })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update progress' },
      { status: 500 }
    )
  }
}
