'use client'

import { useState } from 'react'

// Ordinal ramp (one hue, monotone lightness) — validated against this app's
// dark card surface (#161b22) with scripts/validate_palette.js --ordinal.
// Steps 200/300/400/500/600 from the sequential blue ramp; lightest = earliest
// tier, darkest = most advanced, so depth-of-color reads as depth-of-progress.
const TIER_COLORS = ['#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95']

export interface LevelCount {
  level: string
  count: number
}

interface ProgressChartProps {
  data: LevelCount[]
}

export function ProgressChart({ data }: ProgressChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const widthPct = d.count > 0 ? Math.max((d.count / max) * 100, 4) : 0
        const color = TIER_COLORS[i % TIER_COLORS.length]

        return (
          <div
            key={d.level}
            className="flex items-center gap-3 relative"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(i)}
            onBlur={() => setHoveredIndex(null)}
            tabIndex={0}
          >
            <span className="w-28 shrink-0 text-sm text-[#8b949e] text-right">{d.level}</span>

            <div className="flex-1 h-5 bg-[#0d1117] rounded-r-[4px] overflow-hidden">
              <div
                className="h-full rounded-r-[4px] transition-[width]"
                style={{ width: `${widthPct}%`, backgroundColor: color }}
              />
            </div>

            <span className="w-6 shrink-0 text-sm text-[#e6edf3] tabular-nums">{d.count}</span>

            {hoveredIndex === i && (
              <div className="absolute left-28 -top-9 bg-[#21262d] border border-[#30363d] rounded-md px-2 py-1 text-xs whitespace-nowrap shadow-lg z-10">
                <span className="text-[#e6edf3] font-semibold">{d.count}</span>{' '}
                <span className="text-[#8b949e]">
                  student{d.count !== 1 ? 's' : ''} at {d.level}
                </span>
              </div>
            )}
          </div>
        )
      })}
      {data.every((d) => d.count === 0) && (
        <p className="text-[#8b949e] text-sm">No placements recorded yet.</p>
      )}
    </div>
  )
}
