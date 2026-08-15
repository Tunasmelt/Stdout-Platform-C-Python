'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { StudentTable, type StudentSummary } from '@/components/teacher/StudentTable'
import { ProgressChart, type LevelCount } from '@/components/teacher/ProgressChart'

const LEVEL_ORDER = ['beginner', 'beginner_plus', 'intermediate', 'intermediate_plus', 'advanced']
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  beginner_plus: 'Beginner+',
  intermediate: 'Intermediate',
  intermediate_plus: 'Intermediate+',
  advanced: 'Advanced',
}

interface Track {
  id: string
  slug: string
  title: string
}

const inputClass =
  'bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#e6edf3] focus:outline-none focus:border-[#f78166]'

export default function StudentsPage() {
  const supabase = createClient()
  const [tracks, setTracks] = useState<Track[]>([])
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [minCompleted, setMinCompleted] = useState(0)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [{ data: trackData }, { data: profileData, error: profileError }] = await Promise.all([
          supabase.from('tracks').select('id, slug, title').order('title'),
          supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('role', 'student')
            .order('email'),
        ])

        if (profileError) throw profileError
        setTracks(trackData || [])

        const studentIds = (profileData || []).map((p) => p.id)

        const [{ data: statsData }, { data: resultsData }, { data: progressData }] = await Promise.all([
          supabase.from('user_stats').select('user_id, xp, streak_days, last_active').in('user_id', studentIds),
          supabase
            .from('assessment_results')
            .select('user_id, track_id, placed_level, tracks(title)')
            .in('user_id', studentIds),
          supabase
            .from('student_progress')
            .select('user_id, completed')
            .in('user_id', studentIds),
        ])

        const statsByUser = new Map((statsData || []).map((s) => [s.user_id, s]))
        const resultsByUser = new Map<string, Array<{ trackTitle: string; placedLevel: string }>>()
        const typedResults = resultsData as unknown as Array<{
          user_id: string
          placed_level: string
          tracks: { title: string } | null
        }> | null

        for (const r of typedResults || []) {
          const list = resultsByUser.get(r.user_id) || []
          list.push({ trackTitle: r.tracks?.title ?? '—', placedLevel: r.placed_level })
          resultsByUser.set(r.user_id, list)
        }
        const progressByUser = new Map<string, { completed: number; attempted: number }>()
        for (const p of progressData || []) {
          const entry = progressByUser.get(p.user_id) || { completed: 0, attempted: 0 }
          entry.attempted += 1
          if (p.completed) entry.completed += 1
          progressByUser.set(p.user_id, entry)
        }

        const summaries: StudentSummary[] = (profileData || []).map((profile) => {
          const stats = statsByUser.get(profile.id)
          const progress = progressByUser.get(profile.id) || { completed: 0, attempted: 0 }
          return {
            id: profile.id,
            name: profile.full_name || profile.email,
            email: profile.email,
            xp: stats?.xp ?? 0,
            streakDays: stats?.streak_days ?? 0,
            lastActive: stats?.last_active ?? null,
            placements: resultsByUser.get(profile.id) || [],
            lessonsCompleted: progress.completed,
            lessonsAttempted: progress.attempted,
          }
        })

        setStudents(summaries)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students')
      } finally {
        setIsLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (search && !`${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (trackFilter !== 'all' && !s.placements.some((p) => p.trackTitle === tracks.find((t) => t.id === trackFilter)?.title)) {
        return false
      }
      if (levelFilter !== 'all' && !s.placements.some((p) => p.placedLevel === levelFilter)) {
        return false
      }
      if (s.lessonsCompleted < minCompleted) {
        return false
      }
      return true
    })
  }, [students, search, trackFilter, levelFilter, minCompleted, tracks])

  const levelCounts: LevelCount[] = useMemo(() => {
    const relevant =
      trackFilter === 'all'
        ? students
        : students.filter((s) =>
            s.placements.some((p) => p.trackTitle === tracks.find((t) => t.id === trackFilter)?.title)
          )

    return LEVEL_ORDER.map((level) => ({
      level: LEVEL_LABELS[level],
      count: relevant.filter((s) => s.placements.some((p) => p.placedLevel === level)).length,
    }))
  }, [students, trackFilter, tracks])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-syne text-3xl font-bold text-[#e6edf3] mb-8">Students</h1>

      {error && (
        <Card className="border-red-500 mb-6">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle as="h3">Placement distribution{trackFilter !== 'all' ? ` — ${tracks.find((t) => t.id === trackFilter)?.title}` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressChart data={levelCounts} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className={inputClass}
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputClass} value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}>
          <option value="all">All tracks</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select className={inputClass} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="all">All levels</option>
          {LEVEL_ORDER.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-[#8b949e] text-sm">Min. completed</label>
          <input
            type="number"
            className={`${inputClass} w-20`}
            value={minCompleted}
            onChange={(e) => setMinCompleted(Number(e.target.value))}
            min={0}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-[#8b949e]">Loading...</p>
      ) : (
        <StudentTable students={filteredStudents} />
      )}
    </div>
  )
}
