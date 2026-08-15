'use client'

import { Fragment, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface StudentPlacement {
  trackTitle: string
  placedLevel: string
}

export interface StudentSummary {
  id: string
  name: string
  email: string
  xp: number
  streakDays: number
  lastActive: string | null
  placements: StudentPlacement[]
  lessonsCompleted: number
  lessonsAttempted: number
}

interface LessonHistoryRow {
  lessonTitle: string
  completed: boolean
  attempts: number
}

function formatDate(value: string | null) {
  if (!value) return 'Never'
  return new Date(value).toLocaleDateString()
}

export function StudentTable({ students }: { students: StudentSummary[] }) {
  const supabase = createClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [history, setHistory] = useState<LessonHistoryRow[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const toggleExpand = async (studentId: string) => {
    if (expandedId === studentId) {
      setExpandedId(null)
      return
    }

    setExpandedId(studentId)
    setIsLoadingHistory(true)
    const { data } = await supabase
      .from('student_progress')
      .select('completed, attempts, lessons(title)')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })

    setHistory(
      (data || []).map((row: any) => ({
        lessonTitle: row.lessons?.title ?? 'Unknown lesson',
        completed: row.completed,
        attempts: row.attempts,
      }))
    )
    setIsLoadingHistory(false)
  }

  if (students.length === 0) {
    return <p className="text-[#8b949e]">No students match the current filters.</p>
  }

  return (
    <div className="border border-[#30363d] rounded-lg overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-[#0d1117] text-[#8b949e] text-left">
            <th className="px-4 py-3 font-medium">Student</th>
            <th className="px-4 py-3 font-medium">Track / Level</th>
            <th className="px-4 py-3 font-medium text-right">XP</th>
            <th className="px-4 py-3 font-medium text-right">Streak</th>
            <th className="px-4 py-3 font-medium text-right">Completed</th>
            <th className="px-4 py-3 font-medium">Last active</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <Fragment key={s.id}>
              <tr
                className="border-t border-[#30363d] hover:bg-[#161b22] cursor-pointer"
                onClick={() => toggleExpand(s.id)}
              >
                <td className="px-4 py-3">
                  <p className="text-[#e6edf3] font-medium">{s.name}</p>
                  <p className="text-[#8b949e] text-xs">{s.email}</p>
                </td>
                <td className="px-4 py-3 text-[#8b949e]">
                  {s.placements.length === 0
                    ? '—'
                    : s.placements.map((p) => `${p.trackTitle}: ${p.placedLevel}`).join(', ')}
                </td>
                <td className="px-4 py-3 text-right text-[#f78166] tabular-nums">{s.xp}</td>
                <td className="px-4 py-3 text-right text-[#e6edf3] tabular-nums">{s.streakDays}d</td>
                <td className="px-4 py-3 text-right text-[#e6edf3] tabular-nums">
                  {s.lessonsCompleted}/{s.lessonsAttempted}
                </td>
                <td className="px-4 py-3 text-[#8b949e]">{formatDate(s.lastActive)}</td>
              </tr>
              {expandedId === s.id && (
                <tr className="border-t border-[#30363d] bg-[#0d1117]">
                  <td colSpan={6} className="px-4 py-4">
                    {isLoadingHistory ? (
                      <p className="text-[#8b949e] text-sm">Loading lesson history...</p>
                    ) : history.length === 0 ? (
                      <p className="text-[#8b949e] text-sm">No lesson attempts yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {history.map((h, i) => (
                          <li key={i} className="flex justify-between text-sm">
                            <span className="text-[#e6edf3]">{h.lessonTitle}</span>
                            <span className="text-[#8b949e]">
                              {h.completed ? '✓ Completed' : `${h.attempts} attempt${h.attempts !== 1 ? 's' : ''}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
