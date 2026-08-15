'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LessonEditor, type TeacherChapter, type TeacherTrack } from '@/components/teacher/LessonEditor'

export default function NewLessonPage() {
  const searchParams = useSearchParams()
  const [tracks, setTracks] = useState<TeacherTrack[]>([])
  const [chapters, setChapters] = useState<TeacherChapter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const [{ data: trackData }, { data: chapterData }] = await Promise.all([
        supabase.from('tracks').select('id, slug, title').order('title'),
        supabase.from('chapters').select('id, track_id, title, order_index').order('order_index'),
      ])
      setTracks(trackData || [])
      setChapters(chapterData || [])
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-[#8b949e]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-syne text-3xl font-bold text-[#e6edf3] mb-8">New Lesson</h1>
      <LessonEditor
        mode="create"
        tracks={tracks}
        chapters={chapters}
        initialTrackId={searchParams.get('track') ?? undefined}
      />
    </div>
  )
}
