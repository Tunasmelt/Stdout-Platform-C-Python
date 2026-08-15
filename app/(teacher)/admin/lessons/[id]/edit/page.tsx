'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  LessonEditor,
  type LessonRecord,
  type TeacherChapter,
  type TeacherTrack,
} from '@/components/teacher/LessonEditor'

export default function EditLessonPage() {
  const params = useParams()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<LessonRecord | null>(null)
  const [tracks, setTracks] = useState<TeacherTrack[]>([])
  const [chapters, setChapters] = useState<TeacherChapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const [{ data: lessonData, error: lessonError }, { data: trackData }, { data: chapterData }] =
        await Promise.all([
          supabase.from('lessons').select('*').eq('id', lessonId).maybeSingle(),
          supabase.from('tracks').select('id, slug, title').order('title'),
          supabase.from('chapters').select('id, track_id, title, order_index').order('order_index'),
        ])

      if (lessonError || !lessonData) {
        setError(lessonError?.message || 'Lesson not found')
      } else {
        setLesson(lessonData)
      }
      setTracks(trackData || [])
      setChapters(chapterData || [])
      setIsLoading(false)
    }
    load()
  }, [lessonId])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-[#8b949e]">Loading...</p>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-red-500">
          <p className="text-red-400 mb-4">{error || 'Lesson not found'}</p>
          <Link href="/admin/lessons">
            <Button variant="outline">Back to lessons</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-syne text-3xl font-bold text-[#e6edf3] mb-8">Edit Lesson</h1>
      <LessonEditor mode="edit" initialLesson={lesson} tracks={tracks} chapters={chapters} />
    </div>
  )
}
