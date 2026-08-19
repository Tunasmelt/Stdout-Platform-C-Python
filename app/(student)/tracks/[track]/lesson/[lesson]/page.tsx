'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'
import { runPython } from '@/lib/wasm/pyodide-runner'
import { runCppCode } from '@/lib/wasm/cpp-runner'
import { runViaHarness } from '@/lib/harness/client'
import { saveProgressAttemptLocally } from '@/lib/offline/writes'
import { runSync } from '@/lib/offline/sync'
import type { RunResult } from '@/types/index'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface Lesson {
  id: string
  title: string
  content_md: string
  exercise_md: string
  starter_code: string
  difficulty: string
  order_index: number
  chapter_id: string
}

interface CompletionInfo {
  xpAwarded: number
  streakDays: number
}

type LessonLanguage = 'python' | 'c' | 'cpp'

export default function LessonPage() {
  const params = useParams()

  const trackId = params.track as string
  const lessonId = params.lesson as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [language, setLanguage] = useState<LessonLanguage>('c')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [completion, setCompletion] = useState<CompletionInfo | null>(null)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const loadLesson = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        setUserId(userData.user?.id ?? null)

        const [{ data: lessonData, error: lessonError }, { data: trackData }, { data: progressData }] =
          await Promise.all([
            // solution_code is deliberately excluded — RLS is row-level only and cannot hide it
            supabase
              .from('lessons')
              .select(
                'id, title, content_md, exercise_md, starter_code, difficulty, order_index, chapter_id'
              )
              .eq('id', lessonId)
              .maybeSingle(),
            supabase.from('tracks').select('slug').eq('id', trackId).maybeSingle(),
            userData.user
              ? supabase
                  .from('student_progress')
                  .select('completed')
                  .eq('user_id', userData.user.id)
                  .eq('lesson_id', lessonId)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ])

        if (lessonError) throw lessonError
        if (!lessonData) throw new Error('Lesson not found')

        setLesson(lessonData)
        setCode(lessonData.starter_code || '')
        // The schema has no per-lesson language field, so the whole c-cpp
        // track shares one execution language. Defaults to 'c', not 'cpp' —
        // live-tested (see cpp-runner.ts's header comment / HANDOFF.md): C
        // compiles and runs correctly in ~10-30s, C++ does not complete
        // within 240+ seconds via this toolchain. 'cpp' here would make
        // every lesson in this track fail every time.
        setLanguage(trackData?.slug === 'python' ? 'python' : 'c')
        setAlreadyCompleted(!!progressData?.completed)
      } catch (err) {
        console.error('Error loading lesson:', err)
        setError(err instanceof Error ? err.message : 'Failed to load lesson')
      } finally {
        setIsLoading(false)
      }
    }

    loadLesson()
  }, [lessonId, trackId])

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput(null)
    setCompletion(null)

    let result: RunResult
    try {
      result = language === 'python' ? await runPython(code) : await runCppCode(code, language)
      if (result.unavailable) {
        // WASM itself couldn't load/run — fall back to the harness, not for
        // ordinary code errors, which the runner above already reports.
        result = await runViaHarness(language, code)
      }
      setOutput(result)
    } catch (err) {
      result = {
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        compileError: err instanceof Error ? err.message : 'Unknown error',
        timedOut: false,
        executionMs: 0,
      }
      setOutput(result)
    } finally {
      setIsRunning(false)
    }

    // Completion/XP require server-side grading (expected_output is checked
    // there, not trusted from the client — see Phase 4's audit fix), so that
    // can only happen through this direct call, not the offline queue below.
    // Attempts/last_code fall back to a local-first save if this fails for
    // any reason (offline, or a flaky connection despite appearing online) —
    // never both, to avoid double-counting attempts.
    let savedOnline = false
    try {
      const response = await fetch('/api/progress/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          lastCode: code,
          stdout: result.stdout,
          hadError: !!result.compileError,
        }),
      })
      if (response.ok) {
        savedOnline = true
        const data = await response.json()
        if (data.passed) {
          setAlreadyCompleted(true)
          if (data.xpAwarded > 0) {
            setCompletion({ xpAwarded: data.xpAwarded, streakDays: data.streakDays })
          }
        }
      }
    } catch {
      // Network-level failure — fall through to the local-first save below.
    }

    if (!savedOnline && userId) {
      await saveProgressAttemptLocally({ userId, lessonId, lastCode: code })
      runSync().catch(() => {}) // best-effort — the periodic/focus/online triggers will retry regardless
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#8b949e]">Loading lesson...</p>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Lesson not found'}</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-0 min-h-screen bg-[#0d1117]">
      {/* Left panel: lesson content */}
      <div className="overflow-y-auto border-r border-[#30363d] p-6 sm:p-8">
        <div className="max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-full text-xs font-medium text-[#8b949e]">
                {lesson.difficulty}
              </span>
              {alreadyCompleted && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0d2818] border border-[#3fb950] rounded-full text-xs font-medium text-[#3fb950]">
                  ✓ Completed
                </span>
              )}
            </div>
            <h1 className="font-syne text-4xl font-bold text-[#e6edf3]">{lesson.title}</h1>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none mb-12">
            <div className="markdown-content">
              <ReactMarkdown
                rehypePlugins={[rehypeHighlight]}
                components={{
                  h2: ({ ...props }) => (
                    <h2 className="font-syne text-2xl font-bold mt-6 mb-3 text-[#e6edf3]" {...props} />
                  ),
                  h3: ({ ...props }) => (
                    <h3 className="font-syne text-xl font-bold mt-4 mb-2 text-[#e6edf3]" {...props} />
                  ),
                  p: ({ ...props }) => <p className="mb-4 text-[#c9d1d9] leading-relaxed" {...props} />,
                  ul: ({ ...props }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2 text-[#c9d1d9]" {...props} />
                  ),
                  li: ({ ...props }) => <li className="ml-2" {...props} />,
                  code: ({ inline, ...props }) =>
                    inline ? (
                      <code className="bg-[#161b22] px-2 py-0.5 rounded text-[#f78166] font-jetbrains-mono text-sm" {...props} />
                    ) : (
                      <code className="block bg-[#161b22] p-4 rounded-lg overflow-x-auto mb-4 font-jetbrains-mono text-sm" {...props} />
                    ),
                  pre: ({ ...props }) => (
                    <pre className="bg-[#161b22] p-4 rounded-lg overflow-x-auto mb-4" {...props} />
                  ),
                }}
              >
                {lesson.content_md}
              </ReactMarkdown>
            </div>
          </div>

          {/* Exercise */}
          <Card className="mb-8 border-[#f78166]">
            <CardHeader>
              <CardTitle>Try It</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="markdown-content text-[#c9d1d9]">
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {lesson.exercise_md}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Right panel: code editor */}
      <div className="bg-[#161b22] border-l border-[#30363d] flex flex-col">
        <div className="flex-1 min-h-[300px]">
          <MonacoEditor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? '')}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        </div>

        <div className="p-6 sm:p-8 border-t border-[#30363d]">
          <Button
            onClick={handleRunCode}
            disabled={isRunning}
            variant="primary"
            className="w-full mb-4"
          >
            {isRunning ? 'Running...' : 'Run Code →'}
          </Button>

          {completion && (
            <div className="animate-pop-in mb-4 bg-[#0d2818] border border-[#3fb950] rounded-lg p-4 text-center">
              <p className="text-[#3fb950] font-semibold">🎉 Lesson complete! +{completion.xpAwarded} XP</p>
              <p className="text-[#8b949e] text-xs mt-1">
                {completion.streakDays} day{completion.streakDays !== 1 ? 's' : ''} streak
              </p>
            </div>
          )}

          {output && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 font-jetbrains-mono text-sm max-h-48 overflow-auto">
              {output.compileError ? (
                <p className="text-red-400 whitespace-pre-wrap">{output.compileError}</p>
              ) : (
                <>
                  {output.stdout && (
                    <p className="text-[#c9d1d9] whitespace-pre-wrap">{output.stdout}</p>
                  )}
                  {output.stderr && (
                    <p className="text-red-400 whitespace-pre-wrap">{output.stderr}</p>
                  )}
                  {!output.stdout && !output.stderr && (
                    <p className="text-[#8b949e]">No output</p>
                  )}
                </>
              )}
              <p className="text-[#8b949e] text-xs mt-2">
                {output.timedOut ? 'Timed out' : `Ran in ${output.executionMs}ms`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
