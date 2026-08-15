-- =============================================================================
-- CodeLearn — Initial Schema
-- Migration 0001
-- =============================================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  full_name   text,
  role        text check (role in ('student', 'teacher')) default 'student',
  created_at  timestamptz default now() not null
);

-- Tracks (C/C++, Python)
create table public.tracks (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  icon        text,
  created_at  timestamptz default now() not null
);

-- Chapters
create table public.chapters (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid references public.tracks on delete cascade not null,
  title       text not null,
  order_index int not null,
  created_at  timestamptz default now() not null
);

-- Lessons
create table public.lessons (
  id              uuid primary key default gen_random_uuid(),
  chapter_id      uuid references public.chapters on delete cascade not null,
  title           text not null,
  slug            text not null,
  content_md      text default '',
  exercise_md     text default '',
  starter_code    text default '',
  solution_code   text default '',   -- NEVER expose to students
  expected_output text default '',
  difficulty      text check (difficulty in ('beginner', 'intermediate', 'hard')) default 'beginner',
  order_index     int not null,
  is_published    boolean default false not null,
  created_at      timestamptz default now() not null
);

-- Assessment questions
create table public.assessment_questions (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid references public.tracks on delete cascade not null,
  question    text not null,
  options     jsonb not null,
  correct     text not null,
  difficulty  text check (difficulty in ('beginner', 'intermediate', 'advanced')) default 'beginner',
  order_index int not null
);

-- Assessment results (one per user per track)
create table public.assessment_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles on delete cascade not null,
  track_id     uuid references public.tracks on delete cascade not null,
  self_level   text not null,
  quiz_score   int not null,
  placed_level text not null,
  created_at   timestamptz default now() not null,
  unique (user_id, track_id)
);

-- Student progress (one row per user per lesson)
create table public.student_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles on delete cascade not null,
  lesson_id    uuid references public.lessons on delete cascade not null,
  completed    boolean default false not null,
  attempts     int default 0 not null,
  last_code    text,
  completed_at timestamptz,
  created_at   timestamptz default now() not null,
  unique (user_id, lesson_id)
);

-- User stats (XP, streaks)
create table public.user_stats (
  user_id     uuid references public.profiles on delete cascade primary key,
  xp          int default 0 not null,
  streak_days int default 0 not null,
  last_active date
);
