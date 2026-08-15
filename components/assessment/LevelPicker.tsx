'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { AssessmentLevel } from '@/types/index'

interface LevelPickerProps {
  onSelect: (level: AssessmentLevel) => void
  isLoading?: boolean
}

export const LevelPicker: React.FC<LevelPickerProps> = ({
  onSelect,
  isLoading = false,
}) => {
  const levels: Array<{
    value: AssessmentLevel
    label: string
    description: string
    icon: string
  }> = [
    {
      value: 'beginner',
      label: 'Beginner',
      description: "I'm new to this language",
      icon: '🌱',
    },
    {
      value: 'intermediate',
      label: 'Intermediate',
      description: 'I have some experience',
      icon: '🌿',
    },
    {
      value: 'advanced',
      label: 'Advanced',
      description: 'I know this language well',
      icon: '🌳',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-syne text-3xl font-bold mb-2 text-[#e6edf3]">
          What's your experience level?
        </h2>
        <p className="text-[#8b949e]">
          This helps us place you at the right starting point.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => onSelect(level.value)}
            disabled={isLoading}
            className="text-left transition-all hover:scale-105 disabled:opacity-50"
          >
            <Card className="h-full cursor-pointer hover:border-[#f78166] hover:bg-[#21262d]">
              <div className="text-5xl mb-4">{level.icon}</div>
              <h3 className="font-syne font-bold text-xl mb-2 text-[#f78166]">
                {level.label}
              </h3>
              <p className="text-[#8b949e] text-sm">{level.description}</p>
            </Card>
          </button>
        ))}
      </div>

      <p className="text-center text-[#8b949e] text-sm">
        Don't worry — you can retake this later from your dashboard.
      </p>
    </div>
  )
}
