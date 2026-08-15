'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Track {
  id: string
  slug: string
  title: string
  description: string | null
  icon: string | null
}

interface Chapter {
  id: string
  title: string
  order_index: number
}

interface LessonSummary {
  id: string
  title: string
  difficulty: string
  order_index: number
  chapter_id: string
  completed: boolean
}

export default function TrackOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const trackId = params.track as string
  const supabase = createClient()

  const [track, setTrack] = useState<Track | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [hasAssessment, setHasAssessment] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        const [{ data: trackData, error: trackError }, { data: assessmentData }] = await Promise.all([
          supabase
            .from('tracks')
            .select('id, slug, title, description, icon')
            .eq('id', trackId)
            .maybeSingle(),
          supabase
            .from('assessment_results')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('track_id', trackId)
            .maybeSingle(),
        ])

        if (trackError || !trackData) throw new Error(trackError?.message || 'Track not found')
        setTrack(trackData)
        setHasAssessment(!!assessmentData)

        if (!assessmentData) {
          setIsLoading(false)
          return
        }

        const { data: chapterData } = await supabase
          .from('chapters')
          .select('id, title, order_index')
          .eq('track_id', trackId)
          .order('order_index')

        setChapters(chapterData || [])

        const chapterIds = (chapterData || []).map((c) => c.id)
        if (chapterIds.length === 0) {
          setIsLoading(false)
          return
        }

        const [{ data: lessonData }, { data: progressData }] = await Promise.all([
          supabase
            .from('lessons')
            .select('id, title, difficulty, order_index, chapter_id')
            .in('chapter_id', chapterIds)
            .eq('is_published', true)
            .order('order_index'),
          supabase.from('student_progress').select('lesson_id, completed').eq('user_id', userData.user.id),
        ])

        const completedIds = new Set(
          (progressData || []).filter((p) => p.completed).map((p) => p.lesson_id)
        )

        setLessons(
          (lessonData || []).map((l) => ({
            ...l,
            completed: completedIds.has(l.id),
          }))
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load track')
      } finally {
        setIsLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-[#8b949e]">Loading...</p>
      </div>
    )
  }

  if (error || !track) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-red-500">
          <p className="text-red-400 mb-4">{error || 'Track not found'}</p>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (!hasAssessment) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center">
          <div className="text-5xl mb-4">{track.icon || '📚'}</div>
          <h1 className="font-syne text-3xl font-bold text-[#e6edf3] mb-2">{track.title}</h1>
          <p className="text-[#8b949e] mb-6">
            Take a quick skill assessment to get placed at the right starting lesson.
          </p>
          <Link href={`/assessment?track=${track.id}`}>
            <Button variant="primary">Start Assessment</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="text-5xl mb-2">{track.icon || '📚'}</div>
        <h1 className="font-syne text-4xl font-bold text-[#e6edf3]">{track.title}</h1>
        <p className="text-[#8b949e]">{track.description}</p>
      </div>

      {chapters.length === 0 ? (
        <Card>
          <p className="text-center text-[#8b949e]">No chapters published yet for this track.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {chapters.map((chapter) => {
            const chapterLessons = lessons.filter((l) => l.chapter_id === chapter.id)
            if (chapterLessons.length === 0) return null

            return (
              <div key={chapter.id}>
                <h2 className="font-syne text-xl font-bold text-[#e6edf3] mb-3">{chapter.title}</h2>
                <div className="space-y-2">
                  {chapterLessons.map((lesson) => (
                    <Link key={lesson.id} href={`/tracks/${track.id}/lesson/${lesson.id}`}>
                      <Card className="py-3 hover:border-[#f78166] transition-colors">
                        <CardContent className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span>{lesson.completed ? '✓' : '○'}</span>
                            <span className="text-[#e6edf3]">{lesson.title}</span>
                          </div>
                          <span className="text-xs text-[#8b949e]">{lesson.difficulty}</span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
