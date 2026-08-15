'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Difficulty } from '@/types/index'

interface LessonRow {
  id: string
  title: string
  difficulty: Difficulty
  order_index: number
  is_published: boolean
  chapter_id: string
  chapters: {
    title: string
    track_id: string
    tracks: { title: string; slug: string } | null
  } | null
}

export default function LessonsListPage() {
  const [lessons, setLessons] = useState<LessonRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadLessons = async () => {
    setIsLoading(true)
    const { data, error: fetchError } = await supabase
      .from('lessons')
      .select(
        'id, title, difficulty, order_index, is_published, chapter_id, chapters(title, track_id, tracks(title, slug))'
      )
      .order('order_index')

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setLessons((data as any) || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const togglePublished = async (lesson: LessonRow) => {
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ is_published: !lesson.is_published })
      .eq('id', lesson.id)

    if (updateError) {
      setError(updateError.message)
      return
    }
    setLessons((prev) =>
      prev.map((l) => (l.id === lesson.id ? { ...l, is_published: !l.is_published } : l))
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne text-3xl font-bold text-[#e6edf3]">Lessons</h1>
          <p className="text-[#8b949e]">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/lessons/new">
          <Button variant="primary">+ New Lesson</Button>
        </Link>
      </div>

      {error && (
        <Card className="border-red-500 mb-6">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {isLoading ? (
        <p className="text-[#8b949e]">Loading...</p>
      ) : lessons.length === 0 ? (
        <Card>
          <p className="text-center text-[#8b949e]">
            No lessons yet. Create the first one to unblock the student assessment flow.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="py-3">
              <CardContent className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#8b949e]">
                      {lesson.chapters?.tracks?.title ?? '—'} / {lesson.chapters?.title ?? '—'}
                    </span>
                    <span className="inline-block px-2 py-0.5 bg-[#0d1117] border border-[#30363d] rounded-full text-xs text-[#8b949e]">
                      {lesson.difficulty}
                    </span>
                    <span className="text-xs text-[#8b949e]">#{lesson.order_index}</span>
                  </div>
                  <p className="text-[#e6edf3] font-medium truncate">{lesson.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant={lesson.is_published ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => togglePublished(lesson)}
                  >
                    {lesson.is_published ? 'Published' : 'Draft'}
                  </Button>
                  <Link href={`/admin/lessons/${lesson.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle as="h3">Reminder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#8b949e] text-sm">
            Placement (in the student assessment) jumps straight to a lesson by its{' '}
            <code className="text-[#f78166]">order_index</code> within a track — 1, 4, 8, 12, or 14.
            Make sure lessons at those indices exist and are published for each track, or placement
            will fail.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
