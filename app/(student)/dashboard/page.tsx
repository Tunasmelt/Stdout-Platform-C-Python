'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface StudentProgress {
  id: string
  lesson_id: string
  lesson: { title: string; chapter_id: string }
  completed: boolean
  attempts: number
  created_at: string
}

interface Track {
  id: string
  slug: string
  title: string
  icon: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTrack, setActiveTrack] = useState<Track | null>(null)
  const [progress, setProgress] = useState<StudentProgress[]>([])
  const [stats, setStats] = useState({ xp: 0, streak: 0 })

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        // Load user stats
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('xp, streak_days')
          .eq('user_id', userData.user.id)
          .maybeSingle()

        if (statsData) {
          setStats({ xp: statsData.xp, streak: statsData.streak_days })
        }

        // Load latest assessment result to show active track
        const { data: assessmentData } = await supabase
          .from('assessment_results')
          .select('track_id, placed_level')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (assessmentData) {
          // Load the track info
          const { data: trackData } = await supabase
            .from('tracks')
            .select('*')
            .eq('id', assessmentData.track_id)
            .maybeSingle()

          if (trackData) {
            setActiveTrack(trackData)
          }

          // Load progress
          const { data: progressData } = await supabase
            .from('student_progress')
            .select(
              `
              id,
              lesson_id,
              completed,
              attempts,
              created_at,
              lessons (
                title,
                chapter_id
              )
            `
            )
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false })
            .limit(10)

          if (progressData) {
            setProgress(
              progressData.map((p) => ({
                ...p,
                lesson: p.lessons as any,
              }))
            )
          }
        }
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [supabase, router])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-[#8b949e]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="font-syne text-4xl font-bold mb-2 text-[#e6edf3]">Welcome back!</h1>
        <p className="text-[#8b949e]">Here's your learning progress.</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8b949e] text-sm mb-2">Total XP</p>
                <p className="font-syne text-4xl font-bold text-[#f78166]">{stats.xp}</p>
              </div>
              <span className="text-5xl">⚡</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8b949e] text-sm mb-2">Current Streak</p>
                <p className="font-syne text-4xl font-bold text-[#3fb950]">{stats.streak} days</p>
              </div>
              <span className="text-5xl">🔥</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active track */}
      {activeTrack ? (
        <div className="mb-12">
          <h2 className="font-syne text-2xl font-bold mb-4 text-[#e6edf3]">
            {activeTrack.title} Track
          </h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-[#8b949e] mb-6">
                You're learning {activeTrack.title}. Continue with your lessons or retake the
                assessment.
              </p>
              <div className="flex gap-4">
                <Link href={`/tracks/${activeTrack.id}`}>
                  <Button variant="primary">Continue Learning</Button>
                </Link>
                <Link href={`/assessment?track=${activeTrack.id}`}>
                  <Button variant="outline">Retake Assessment</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-[#8b949e] mb-6">
                You haven't started a track yet. Choose one to get started!
              </p>
              <Link href="/tracks">
                <Button variant="primary">Pick a Track</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent progress */}
      {progress.length > 0 && (
        <div>
          <h2 className="font-syne text-2xl font-bold mb-4 text-[#e6edf3]">Recent Activity</h2>
          <div className="space-y-2">
            {progress.map((p) => (
              <Card key={p.id} className="py-3">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-[#e6edf3] font-medium">{p.lesson?.title}</p>
                    <p className="text-[#8b949e] text-sm">
                      {p.completed ? '✓ Completed' : `${p.attempts} attempt${p.attempts !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <span>{p.completed ? '✓' : '→'}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
