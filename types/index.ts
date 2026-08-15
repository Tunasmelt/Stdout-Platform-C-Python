// =============================================================================
// CodeLearn — Shared TypeScript Types
// Keep in sync with Supabase schema
// =============================================================================

export type UserRole = 'student' | 'teacher'
export type Difficulty = 'beginner' | 'intermediate' | 'hard'
export type TrackSlug = 'c-cpp' | 'python'
export type Language = 'c' | 'cpp' | 'python'
export type AssessmentLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Track {
  id: string
  slug: TrackSlug
  title: string
  description: string
  icon: string | null
  created_at: string
}

export interface Chapter {
  id: string
  track_id: string
  title: string
  order_index: number
  created_at: string
}

export interface Lesson {
  id: string
  chapter_id: string
  title: string
  slug: string
  content_md: string
  exercise_md: string
  starter_code: string
  // solution_code is NEVER included — teachers only via server
  expected_output: string
  difficulty: Difficulty
  order_index: number
  is_published: boolean
  created_at: string
}

export interface AssessmentQuestion {
  id: string
  track_id: string
  question: string
  options: Array<{ label: string; value: string; text: string }>
  // correct is NEVER sent to client — validated server-side
  difficulty: AssessmentLevel
  order_index: number
}

export interface AssessmentResult {
  id: string
  user_id: string
  track_id: string
  self_level: AssessmentLevel
  quiz_score: number
  placed_level: string
  created_at: string
}

export interface StudentProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  attempts: number
  last_code: string | null
  completed_at: string | null
  created_at: string
}

export interface UserStats {
  user_id: string
  xp: number
  streak_days: number
  last_active: string | null
}

// Execution result from WASM runners or harness
export interface RunResult {
  stdout: string
  stderr: string
  compileError: string | null
  timedOut: boolean
  executionMs: number
  // True when the WASM runtime itself couldn't load/run (distinct from the
  // student's code failing) — signals the caller to try the harness fallback.
  unavailable?: boolean
}

// Assessment placement result
export interface PlacementResult {
  level: string
  startLessonIndex: number
}

// Harness execution request/response
export interface ExecuteRequest {
  language: 'python' | 'typescript' | 'c' | 'cpp'
  code: string
  stdin?: string
  timeoutMs?: number // default 10000, hard cap 10000
}

export interface ExecuteResponse {
  stdout: string
  stderr: string
  compileError: string | null
  exitCode: number | null
  timedOut: boolean
  executionMs: number
}
