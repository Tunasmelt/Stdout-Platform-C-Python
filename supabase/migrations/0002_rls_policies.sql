-- =============================================================================
-- CodeLearn — RLS Policies
-- Migration 0002
-- =============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.chapters enable row level security;
alter table public.lessons enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_results enable row level security;
alter table public.student_progress enable row level security;
alter table public.user_stats enable row level security;

-- Helper function: is the current user a teacher?
create or replace function public.is_teacher()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$ language sql security definer stable;

-- profiles
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Teachers read all profiles" on public.profiles
  for select using (public.is_teacher());

create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- tracks (everyone can read)
create policy "Anyone reads tracks" on public.tracks
  for select using (true);

create policy "Teachers manage tracks" on public.tracks
  for all using (public.is_teacher());

-- chapters (everyone can read)
create policy "Anyone reads chapters" on public.chapters
  for select using (true);

create policy "Teachers manage chapters" on public.chapters
  for all using (public.is_teacher());

-- lessons (students see published only, teachers see all)
create policy "Students read published lessons" on public.lessons
  for select using (is_published = true and not public.is_teacher());

create policy "Teachers read all lessons" on public.lessons
  for select using (public.is_teacher());

create policy "Teachers manage lessons" on public.lessons
  for all using (public.is_teacher());

-- assessment_questions (all authenticated can read, teachers write)
create policy "Authenticated users read questions" on public.assessment_questions
  for select using (auth.uid() is not null);

create policy "Teachers manage questions" on public.assessment_questions
  for all using (public.is_teacher());

-- assessment_results
create policy "Users read own results" on public.assessment_results
  for select using (auth.uid() = user_id);

create policy "Users insert own results" on public.assessment_results
  for insert with check (auth.uid() = user_id);

create policy "Teachers read all results" on public.assessment_results
  for select using (public.is_teacher());

-- student_progress
create policy "Users manage own progress" on public.student_progress
  for all using (auth.uid() = user_id);

create policy "Teachers read all progress" on public.student_progress
  for select using (public.is_teacher());

-- user_stats
create policy "Users manage own stats" on public.user_stats
  for all using (auth.uid() = user_id);

create policy "Teachers read all stats" on public.user_stats
  for select using (public.is_teacher());
