'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { AssessmentLevel } from '@/types/index'

const inputClass =
  'w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#e6edf3] focus:outline-none focus:border-[#f78166]'
const labelClass = 'block text-[#8b949e] text-sm font-medium mb-1'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

interface QuestionOption {
  label: string
  value: string
  text: string
}

interface QuestionRow {
  id: string
  track_id: string
  question: string
  options: QuestionOption[]
  correct: string
  difficulty: AssessmentLevel
  order_index: number
}

interface Track {
  id: string
  slug: string
  title: string
}

function emptyOptions(): QuestionOption[] {
  return OPTION_LABELS.map((label, i) => ({ label, value: String.fromCharCode(97 + i), text: '' }))
}

function QuestionForm({
  trackId,
  initial,
  onCancel,
  onSaved,
}: {
  trackId: string
  initial?: QuestionRow
  onCancel: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [options, setOptions] = useState<QuestionOption[]>(initial?.options ?? emptyOptions())
  const [correct, setCorrect] = useState(initial?.correct ?? options[0]?.value ?? 'a')
  const [difficulty, setDifficulty] = useState<AssessmentLevel>(initial?.difficulty ?? 'beginner')
  const [orderIndex, setOrderIndex] = useState(initial?.order_index ?? 1)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOptionText = (index: number, text: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)))
  }

  const handleSave = async () => {
    if (!question.trim() || options.some((o) => !o.text.trim())) {
      setError('Question text and all four options are required.')
      return
    }

    setIsSaving(true)
    setError(null)

    const payload = {
      track_id: trackId,
      question: question.trim(),
      options,
      correct,
      difficulty,
      order_index: orderIndex,
    }

    const result = initial
      ? await supabase.from('assessment_questions').update(payload).eq('id', initial.id)
      : await supabase.from('assessment_questions').insert(payload)

    setIsSaving(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onSaved()
  }

  return (
    <Card className="border-[#f78166]">
      <CardHeader>
        <CardTitle as="h3">{initial ? 'Edit question' : 'New question'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div>
          <label className={labelClass}>Question</label>
          <textarea
            className={inputClass}
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Options — select the correct one</label>
          {options.map((option, i) => (
            <div key={option.value} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct-option"
                checked={correct === option.value}
                onChange={() => setCorrect(option.value)}
                className="w-4 h-4 shrink-0"
              />
              <span className="text-[#8b949e] w-5 shrink-0">{option.label}.</span>
              <input
                className={inputClass}
                value={option.text}
                onChange={(e) => handleOptionText(i, e.target.value)}
                placeholder={`Option ${option.label}`}
              />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Difficulty</label>
            <select
              className={inputClass}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as AssessmentLevel)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Order index</label>
            <input
              type="number"
              className={inputClass}
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save question'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function AssessmentQuestionsPage() {
  const supabase = createClient()
  const [tracks, setTracks] = useState<Track[]>([])
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const loadTracks = async () => {
    const { data } = await supabase.from('tracks').select('id, slug, title').order('title')
    setTracks(data || [])
    if (data && data.length > 0 && !activeTrackId) {
      setActiveTrackId(data[0].id)
    }
  }

  const loadQuestions = async (trackId: string) => {
    setIsLoading(true)
    const { data, error: fetchError } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('track_id', trackId)
      .order('difficulty')
      .order('order_index')

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setQuestions((data as any) || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadTracks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTrackId) {
      loadQuestions(activeTrackId)
      setEditingId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrackId])

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from('assessment_questions').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setConfirmingDeleteId(null)
    if (activeTrackId) loadQuestions(activeTrackId)
  }

  const countsByDifficulty = useMemo(() => {
    return {
      beginner: questions.filter((q) => q.difficulty === 'beginner').length,
      intermediate: questions.filter((q) => q.difficulty === 'intermediate').length,
      advanced: questions.filter((q) => q.difficulty === 'advanced').length,
    }
  }, [questions])

  const enoughForAssessment =
    countsByDifficulty.beginner >= 2 && countsByDifficulty.intermediate >= 2 && countsByDifficulty.advanced >= 1

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-syne text-3xl font-bold text-[#e6edf3] mb-2">Assessment Questions</h1>
      <p className="text-[#8b949e] mb-8">
        Each track's assessment needs at least 2 beginner + 2 intermediate + 1 advanced question.
      </p>

      <div className="flex gap-2 mb-6">
        {tracks.map((t) => (
          <Button
            key={t.id}
            variant={activeTrackId === t.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTrackId(t.id)}
          >
            {t.title}
          </Button>
        ))}
      </div>

      {error && (
        <Card className="border-red-500 mb-6">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      <Card className={`mb-6 ${enoughForAssessment ? '' : 'border-red-500'}`}>
        <CardContent className="flex items-center justify-between">
          <p className={enoughForAssessment ? 'text-[#3fb950]' : 'text-red-400'}>
            {countsByDifficulty.beginner} beginner, {countsByDifficulty.intermediate} intermediate,{' '}
            {countsByDifficulty.advanced} advanced —{' '}
            {enoughForAssessment ? 'ready to serve an assessment' : 'not enough to run the assessment yet'}
          </p>
          {editingId !== 'new' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditingId('new')}
              disabled={!activeTrackId}
            >
              + Add question
            </Button>
          )}
        </CardContent>
      </Card>

      {editingId === 'new' && activeTrackId && (
        <div className="mb-6">
          <QuestionForm
            trackId={activeTrackId}
            onCancel={() => setEditingId(null)}
            onSaved={() => {
              setEditingId(null)
              loadQuestions(activeTrackId)
            }}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-[#8b949e]">Loading...</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) =>
            editingId === q.id ? (
              <QuestionForm
                key={q.id}
                trackId={q.track_id}
                initial={q}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null)
                  if (activeTrackId) loadQuestions(activeTrackId)
                }}
              />
            ) : (
              <Card key={q.id} className="py-3">
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block px-2 py-0.5 bg-[#0d1117] border border-[#30363d] rounded-full text-xs text-[#8b949e]">
                        {q.difficulty}
                      </span>
                      <span className="text-xs text-[#8b949e]">#{q.order_index}</span>
                    </div>
                    <p className="text-[#e6edf3] truncate">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {confirmingDeleteId === q.id ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(q.id)}>
                          Confirm
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setConfirmingDeleteId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setEditingId(q.id)}>
                          Edit
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setConfirmingDeleteId(q.id)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          )}
          {questions.length === 0 && editingId !== 'new' && (
            <Card>
              <p className="text-center text-[#8b949e]">No questions yet for this track.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
