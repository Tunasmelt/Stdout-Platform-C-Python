-- =============================================================================
-- CodeLearn — Seed Data
-- Migration 0004
-- =============================================================================

-- Tracks
insert into public.tracks (slug, title, description, icon) values
  ('c-cpp',  'C & C++',  'Systems programming from fundamentals to OOP. 13 chapters covering the complete Spoton syllabus.', '⚙️'),
  ('python', 'Python',   'Python from zero to confident developer. Practical, readable, and beginner-friendly.', '🐍');

-- NOTE: chapters, lessons, and assessment_questions are added via the teacher dashboard.
-- Seed assessment questions should be added by the teacher after confirming track UUIDs.
