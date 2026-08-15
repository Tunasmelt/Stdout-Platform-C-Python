'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { AssessmentQuestion } from '@/types/index'
import { useState, useMemo } from 'react'

interface QuizQuestionProps {
  question: AssessmentQuestion
  currentQuestion: number
  totalQuestions: number
  onAnswer: (value: string) => void
  isLoading?: boolean
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  currentQuestion,
  totalQuestions,
  onAnswer,
  isLoading = false,
}) => {
  const [selected, setSelected] = useState<string | null>(null)

  // Shuffle options on every render (simple shuffle)
  const shuffledOptions = useMemo(() => {
    const options = [...question.options]
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    return options
  }, [question.options])

  const handleSubmit = () => {
    if (selected) {
      onAnswer(selected)
      setSelected(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-[#8b949e] text-sm font-medium">
            Question {currentQuestion} of {totalQuestions}
          </span>
          <span className="text-[#8b949e] text-sm font-medium">
            {Math.round((currentQuestion / totalQuestions) * 100)}%
          </span>
        </div>
        <div className="w-full bg-[#30363d] rounded-full h-2">
          <div
            className="bg-[#f78166] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <Card>
        <h3 className="font-syne text-2xl font-bold mb-6 text-[#e6edf3]">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {shuffledOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              className="w-full text-left transition-all"
            >
              <div
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selected === option.value
                    ? 'border-[#f78166] bg-[#21262d]'
                    : 'border-[#30363d] hover:border-[#f78166]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                      selected === option.value
                        ? 'border-[#f78166] bg-[#f78166]'
                        : 'border-[#30363d]'
                    }`}
                  >
                    {selected === option.value && (
                      <span className="text-[#0d1117] text-xs font-bold">✓</span>
                    )}
                  </div>
                  <span className="text-[#8b949e] text-sm font-medium">{option.label}.</span>
                  <span className="text-[#e6edf3]">{option.text}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Submit button */}
        <div className="mt-8">
          <Button
            onClick={handleSubmit}
            disabled={!selected || isLoading}
            variant="primary"
            className="w-full"
          >
            {isLoading ? 'Submitting...' : 'Continue'}
          </Button>
        </div>
      </Card>

      <p className="text-center text-[#8b949e] text-sm">
        There are no wrong answers. We just want to understand your level.
      </p>
    </div>
  )
}
