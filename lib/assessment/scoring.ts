import type { AssessmentLevel, PlacementResult } from '@/types/index'

/**
 * Compute placement based on self-reported level + quiz score
 * Returns the assessed level and starting lesson index
 */
export function computePlacement(
  selfLevel: AssessmentLevel,
  quizScore: number
): PlacementResult {
  // quizScore is 0–5 (one point per correct answer)

  if (selfLevel === 'beginner') {
    if (quizScore <= 2) {
      return { level: 'beginner', startLessonIndex: 1 }
    } else {
      return { level: 'beginner_plus', startLessonIndex: 4 }
    }
  }

  if (selfLevel === 'intermediate') {
    if (quizScore <= 2) {
      // Overestimated their level
      return { level: 'beginner_plus', startLessonIndex: 4 }
    } else if (quizScore <= 4) {
      return { level: 'intermediate', startLessonIndex: 8 }
    } else {
      return { level: 'intermediate_plus', startLessonIndex: 12 }
    }
  }

  if (selfLevel === 'advanced') {
    if (quizScore <= 2) {
      // Overestimated their level
      return { level: 'intermediate', startLessonIndex: 8 }
    } else {
      return { level: 'advanced', startLessonIndex: 14 }
    }
  }

  // Fallback (should not reach)
  return { level: 'beginner', startLessonIndex: 1 }
}
