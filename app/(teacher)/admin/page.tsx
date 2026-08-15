'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Stats {
  totalLessons: number
  publishedLessons: number
  totalQuestions: number
  totalStudents: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const [lessons, published, questions, students] = await Promise.all([
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('assessment_questions').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      ])

      const firstError = lessons.error || published.error || questions.error || students.error
      if (firstError) {
        setError(firstError.message)
        return
      }

      setStats({
        totalLessons: lessons.count ?? 0,
        publishedLessons: published.count ?? 0,
        totalQuestions: questions.count ?? 0,
        totalStudents: students.count ?? 0,
      })
    }
    load()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-syne text-3xl font-bold text-[#e6edf3] mb-2">Teacher Dashboard</h1>
      <p className="text-[#8b949e] mb-8">Manage lessons, assessment questions, and student progress.</p>

      {error && (
        <Card className="border-red-500 mb-6">
          <p className="text-red-400">Couldn&apos;t load stats: {error}</p>
        </Card>
      )}

      <div className="grid sm:grid-cols-4 gap-4 mb-12">
        <Card>
          <p className="text-[#8b949e] text-sm mb-1">Lessons</p>
          <p className="font-syne text-3xl font-bold text-[#e6edf3]">{stats?.totalLessons ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-[#8b949e] text-sm mb-1">Published</p>
          <p className="font-syne text-3xl font-bold text-[#3fb950]">{stats?.publishedLessons ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-[#8b949e] text-sm mb-1">Quiz questions</p>
          <p className="font-syne text-3xl font-bold text-[#e6edf3]">{stats?.totalQuestions ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-[#8b949e] text-sm mb-1">Students</p>
          <p className="font-syne text-3xl font-bold text-[#e6edf3]">{stats?.totalStudents ?? '—'}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#8b949e] mb-6">
              Create and edit lessons, organize chapters, and control what&apos;s published.
            </p>
            <Link href="/admin/lessons">
              <Button variant="primary" className="w-full">
                Manage Lessons
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#8b949e] mb-6">
              Edit the onboarding quiz questions used to place new students.
            </p>
            <Link href="/admin/assessment">
              <Button variant="primary" className="w-full">
                Manage Questions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#8b949e] mb-6">
              View progress, placement, and lesson history for every student.
            </p>
            <Link href="/admin/students">
              <Button variant="primary" className="w-full">
                View Students
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
