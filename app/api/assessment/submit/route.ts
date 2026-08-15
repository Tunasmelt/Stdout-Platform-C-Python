import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computePlacement } from '@/lib/assessment/scoring'
import type { AssessmentLevel } from '@/types/index'

interface SubmitBody {
  trackId: string
  selfLevel: AssessmentLevel
  answers: Array<{ questionId: string; value: string }>
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body: SubmitBody = await request.json()
  const { trackId, selfLevel, answers } = body

  if (!trackId || !selfLevel || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Grading happens here, server-side only — `correct` never leaves the DB.
  const { data: questions, error: questionsError } = await supabase
    .from('assessment_questions')
    .select('id, correct')
    .in(
      'id',
      answers.map((a) => a.questionId)
    )

  if (questionsError || !questions) {
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }

  const correctById = new Map(questions.map((q) => [q.id, q.correct]))
  const quizScore = answers.reduce(
    (score, a) => score + (correctById.get(a.questionId) === a.value ? 1 : 0),
    0
  )

  const placement = computePlacement(selfLevel, quizScore)

  const { error: saveError } = await supabase.from('assessment_results').upsert(
    {
      user_id: userData.user.id,
      track_id: trackId,
      self_level: selfLevel,
      quiz_score: quizScore,
      placed_level: placement.level,
    },
    { onConflict: 'user_id,track_id' }
  )

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 })
  }

  // lessons has no track_id column — join through chapters to scope by track.
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, title, chapter_id, chapters!inner(track_id)')
    .eq('chapters.track_id', trackId)
    .eq('order_index', placement.startLessonIndex)
    .maybeSingle()

  if (lessonError || !lesson) {
    return NextResponse.json({ error: 'Could not find lesson for placement' }, { status: 500 })
  }

  await supabase.from('student_progress').upsert(
    {
      user_id: userData.user.id,
      lesson_id: lesson.id,
      completed: false,
      attempts: 0,
    },
    { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
  )

  return NextResponse.json({
    level: placement.level,
    lesson: { id: lesson.id, title: lesson.title },
  })
}
