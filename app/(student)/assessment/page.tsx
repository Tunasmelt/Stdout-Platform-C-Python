'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LevelPicker } from '@/components/assessment/LevelPicker'
import { QuizQuestion } from '@/components/assessment/QuizQuestion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { AssessmentLevel, AssessmentQuestion } from '@/types/index'

type AssessmentStep =
  | 'track-selection'
  | 'level-picker'
  | 'quiz'
  | 'result'
  | 'loading'
  | 'error'

interface SubmitResult {
  level: string
  lesson: { id: string; title: string }
}

export default function AssessmentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const trackId = searchParams.get('track')

  const [step, setStep] = useState<AssessmentStep>('loading')
  const [selectedLevel, setSelectedLevel] = useState<AssessmentLevel | null>(null)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<{ questionId: string; value: string }>>([])
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize assessment
  useEffect(() => {
    const init = async () => {
      try {
        if (!trackId) {
          setStep('track-selection')
          return
        }

        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        // Check if user already took this assessment
        const { data: existing } = await supabase
          .from('assessment_results')
          .select('placed_level')
          .eq('user_id', userData.user.id)
          .eq('track_id', trackId)
          .maybeSingle()

        if (existing) {
          // Find their most recent progress in this track and resume there
          const { data: chapters } = await supabase
            .from('chapters')
            .select('id')
            .eq('track_id', trackId)

          const chapterIds = (chapters || []).map((c) => c.id)

          const { data: recentProgress } = await supabase
            .from('student_progress')
            .select('lesson_id, lessons!inner(chapter_id)')
            .eq('user_id', userData.user.id)
            .in('lessons.chapter_id', chapterIds)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (recentProgress) {
            router.push(`/tracks/${trackId}/lesson/${recentProgress.lesson_id}`)
          } else {
            router.push('/dashboard')
          }
          return
        }

        // Load questions for this track (2 beginner + 2 intermediate + 1 advanced)
        // Never select `correct` here — grading happens server-side only.
        const { data: allQuestions, error: questionsError } = await supabase
          .from('assessment_questions')
          .select('id, track_id, question, options, difficulty, order_index')
          .eq('track_id', trackId)
          .order('order_index')

        if (questionsError) throw questionsError

        // Group by difficulty and pick
        const beginner = allQuestions?.filter((q) => q.difficulty === 'beginner') || []
        const intermediate = allQuestions?.filter((q) => q.difficulty === 'intermediate') || []
        const advanced = allQuestions?.filter((q) => q.difficulty === 'advanced') || []

        const selected = [
          ...beginner.slice(0, 2),
          ...intermediate.slice(0, 2),
          ...advanced.slice(0, 1),
        ]

        if (selected.length < 5) {
          throw new Error('Not enough questions in database for this track')
        }

        setQuestions(selected)
        setStep('level-picker')
      } catch (err) {
        console.error('Assessment init error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize assessment')
        setStep('error')
      }
    }

    init()
  }, [trackId, supabase, router])

  const handleLevelSelect = (level: AssessmentLevel) => {
    setSelectedLevel(level)
    setStep('quiz')
    setCurrentQuestionIndex(0)
  }

  const handleAnswer = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    const newAnswers = [...answers, { questionId: currentQuestion.id, value }]
    setAnswers(newAnswers)

    if (newAnswers.length < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      submitAssessment(newAnswers)
    }
  }

  const submitAssessment = async (finalAnswers: Array<{ questionId: string; value: string }>) => {
    if (!selectedLevel || !trackId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          selfLevel: selectedLevel,
          answers: finalAnswers,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to submit assessment')
      }

      const data: SubmitResult = await response.json()
      setResult(data)
      setStep('result')
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit assessment')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  // Render based on step
  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center">
          <p className="text-[#8b949e]">Loading assessment...</p>
        </Card>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
            <p className="text-[#8b949e] mb-6">{error}</p>
            <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (step === 'track-selection') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Select a Track</h2>
            <p className="text-[#8b949e] mb-6">
              Please select a track before starting the assessment.
            </p>
            <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (step === 'result') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-syne text-3xl font-bold mb-2 text-[#e6edf3]">
              Great work!
            </h2>
            <p className="text-[#8b949e] mb-6">
              We've placed you at <span className="text-[#f78166] font-bold">{result?.level}</span>
              . You'll start with{' '}
              <span className="text-[#f78166] font-bold">{result?.lesson?.title}</span>.
            </p>
            <Button
              onClick={() =>
                router.push(`/tracks/${trackId}/lesson/${result?.lesson?.id}`)
              }
              variant="primary"
              className="w-full"
            >
              Start Learning
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (step === 'level-picker') {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <LevelPicker onSelect={handleLevelSelect} isLoading={isLoading} />
      </div>
    )
  }

  if (step === 'quiz' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex]
    return (
      <div className="max-w-4xl mx-auto py-12">
        <QuizQuestion
          question={currentQuestion}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          isLoading={isLoading}
        />
      </div>
    )
  }

  return null
}
