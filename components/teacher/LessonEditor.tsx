'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'
import type { Difficulty } from '@/types/index'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const inputClass =
  'w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#e6edf3] focus:outline-none focus:border-[#f78166]'
const labelClass = 'block text-[#8b949e] text-sm font-medium mb-1'

export interface TeacherTrack {
  id: string
  slug: string
  title: string
}

export interface TeacherChapter {
  id: string
  track_id: string
  title: string
  order_index: number
}

export interface LessonRecord {
  id: string
  chapter_id: string
  title: string
  slug: string
  content_md: string
  exercise_md: string
  starter_code: string
  solution_code: string
  expected_output: string
  difficulty: Difficulty
  order_index: number
  is_published: boolean
}

interface LessonEditorProps {
  mode: 'create' | 'edit'
  initialLesson?: LessonRecord
  initialTrackId?: string
  tracks: TeacherTrack[]
  chapters: TeacherChapter[]
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function MarkdownField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="grid md:grid-cols-2 gap-2 border border-[#30363d] rounded-md overflow-hidden">
        <div className="h-64 border-b md:border-b-0 md:border-r border-[#30363d]">
          <MonacoEditor
            height="100%"
            language="markdown"
            theme="vs-dark"
            value={value}
            onChange={(v) => onChange(v ?? '')}
            options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on' }}
          />
        </div>
        <div className="h-64 overflow-y-auto p-4 bg-[#0d1117]">
          <div className="prose prose-invert max-w-none text-sm">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{value || '_Nothing to preview yet_'}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LessonEditor({ mode, initialLesson, initialTrackId, tracks, chapters }: LessonEditorProps) {
  const router = useRouter()
  const supabase = createClient()

  const initialChapter = chapters.find((c) => c.id === initialLesson?.chapter_id)
  const initialTrack = initialTrackId ?? initialChapter?.track_id ?? tracks[0]?.id ?? ''

  const [trackId, setTrackId] = useState(initialTrack)
  const [chapterId, setChapterId] = useState(initialLesson?.chapter_id ?? '')
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [chapterList, setChapterList] = useState(chapters)
  const [title, setTitle] = useState(initialLesson?.title ?? '')
  const [slug, setSlug] = useState(initialLesson?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [difficulty, setDifficulty] = useState<Difficulty>(initialLesson?.difficulty ?? 'beginner')
  const [orderIndex, setOrderIndex] = useState(initialLesson?.order_index ?? 1)
  const [isPublished, setIsPublished] = useState(initialLesson?.is_published ?? false)
  const [contentMd, setContentMd] = useState(initialLesson?.content_md ?? '')
  const [exerciseMd, setExerciseMd] = useState(initialLesson?.exercise_md ?? '')
  const [starterCode, setStarterCode] = useState(initialLesson?.starter_code ?? '')
  const [solutionCode, setSolutionCode] = useState(initialLesson?.solution_code ?? '')
  const [expectedOutput, setExpectedOutput] = useState(initialLesson?.expected_output ?? '')

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const codeLanguage = useMemo(() => {
    const track = tracks.find((t) => t.id === trackId)
    return track?.slug === 'python' ? 'python' : 'cpp'
  }, [trackId, tracks])

  const chaptersForTrack = chapterList.filter((c) => c.track_id === trackId)

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim() || !trackId) return
    const nextOrder = chaptersForTrack.length + 1
    const { data, error: insertError } = await supabase
      .from('chapters')
      .insert({ track_id: trackId, title: newChapterTitle.trim(), order_index: nextOrder })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return
    }

    setChapterList([...chapterList, data])
    setChapterId(data.id)
    setNewChapterTitle('')
  }

  const handleSave = async () => {
    if (!title.trim() || !chapterId) {
      setError('Title and chapter are required.')
      return
    }

    setIsSaving(true)
    setError(null)

    const payload = {
      chapter_id: chapterId,
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      content_md: contentMd,
      exercise_md: exerciseMd,
      starter_code: starterCode,
      solution_code: solutionCode,
      expected_output: expectedOutput,
      difficulty,
      order_index: orderIndex,
      is_published: isPublished,
    }

    if (mode === 'create') {
      const { data, error: insertError } = await supabase
        .from('lessons')
        .insert(payload)
        .select('id')
        .single()

      setIsSaving(false)
      if (insertError) {
        setError(insertError.message)
        return
      }
      router.push(`/admin/lessons/${data.id}/edit`)
    } else if (initialLesson) {
      const { error: updateError } = await supabase
        .from('lessons')
        .update(payload)
        .eq('id', initialLesson.id)

      setIsSaving(false)
      if (updateError) {
        setError(updateError.message)
        return
      }
      router.push('/admin/lessons')
    }
  }

  const handleDelete = async () => {
    if (!initialLesson) return
    setIsSaving(true)
    const { error: deleteError } = await supabase.from('lessons').delete().eq('id', initialLesson.id)
    setIsSaving(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    router.push('/admin/lessons')
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-500">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Pointers and memory addresses"
              />
            </div>
            <div>
              <label className={labelClass}>Slug</label>
              <input
                className={inputClass}
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setSlugTouched(true)
                }}
                placeholder="pointers-and-memory-addresses"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Track</label>
              <select
                className={inputClass}
                value={trackId}
                onChange={(e) => {
                  setTrackId(e.target.value)
                  setChapterId('')
                }}
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Chapter</label>
              <select
                className={inputClass}
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
              >
                <option value="">Select a chapter...</option>
                {chaptersForTrack.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Difficulty</label>
              <select
                className={inputClass}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className={labelClass}>Add a new chapter to this track</label>
              <input
                className={inputClass}
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Chapter title"
              />
            </div>
            <Button variant="outline" onClick={handleAddChapter} disabled={!newChapterTitle.trim()}>
              Add chapter
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-center">
            <div>
              <label className={labelClass}>Order index</label>
              <input
                type="number"
                className={inputClass}
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="is_published" className="text-[#e6edf3]">
                Published (visible to students)
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <MarkdownField label="Lesson content (content_md)" value={contentMd} onChange={setContentMd} />
          <MarkdownField label="Exercise instructions (exercise_md)" value={exerciseMd} onChange={setExerciseMd} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className={labelClass}>Starter code (shown to students)</label>
            <div className="h-48 border border-[#30363d] rounded-md overflow-hidden">
              <MonacoEditor
                height="100%"
                language={codeLanguage}
                theme="vs-dark"
                value={starterCode}
                onChange={(v) => setStarterCode(v ?? '')}
                options={{ minimap: { enabled: false }, fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Solution code <span className="text-red-400">— never sent to students</span>
            </label>
            <div className="h-48 border border-red-900 rounded-md overflow-hidden">
              <MonacoEditor
                height="100%"
                language={codeLanguage}
                theme="vs-dark"
                value={solutionCode}
                onChange={(v) => setSolutionCode(v ?? '')}
                options={{ minimap: { enabled: false }, fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Expected output (used for auto-grading)</label>
            <textarea
              className={`${inputClass} font-jetbrains-mono`}
              rows={3}
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          {mode === 'edit' ? (
            confirmingDelete ? (
              <div className="flex gap-2 items-center">
                <span className="text-[#8b949e] text-sm">Delete this lesson permanently?</span>
                <Button variant="outline" size="sm" onClick={handleDelete} disabled={isSaving}>
                  Confirm delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmingDelete(true)}>
                Delete lesson
              </Button>
            )
          ) : (
            <span />
          )}

          <Button onClick={handleSave} disabled={isSaving} variant="primary">
            {isSaving ? 'Saving...' : mode === 'create' ? 'Create lesson' : 'Save changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
