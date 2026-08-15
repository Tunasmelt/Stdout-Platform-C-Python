-- =============================================================================
-- CodeLearn — Seed Assessment Questions
-- Migration 0005
-- =============================================================================

-- C/C++ Questions (requires track_id from 0004_seed_data)
-- Get the C/C++ track ID first:
-- INSERT INTO public.assessment_questions (track_id, question, options, correct, difficulty, order_index)
-- VALUES (
--   (SELECT id FROM public.tracks WHERE slug = 'c-cpp'),
--   'What does printf do in C?',
--   '[{"label":"A","value":"a","text":"Reads input from the user"},{"label":"B","value":"b","text":"Prints output to the screen"},{"label":"C","value":"c","text":"Declares a variable"},{"label":"D","value":"d","text":"Allocates memory"}]'::jsonb,
--   'b',
--   'beginner',
--   1
-- );

-- For now, this migration is a placeholder. Teachers will add questions via the admin dashboard.
-- The seed migration should be run after tracks are created (migration 0004).
-- To add questions, teachers can either:
-- 1. Use the admin dashboard (CMS) to create questions
-- 2. Or manually insert via SQL:

-- Example SQL to add one C/C++ beginner question:
-- INSERT INTO public.assessment_questions (track_id, question, options, correct, difficulty, order_index)
-- SELECT
--   id,
--   'What does printf do in C?',
--   '[{"label":"A","value":"a","text":"Reads input from the user"},{"label":"B","value":"b","text":"Prints output to the screen"},{"label":"C","value":"c","text":"Declares a variable"},{"label":"D","value":"d","text":"Allocates memory"}]'::jsonb,
--   'b',
--   'beginner',
--   1
-- FROM public.tracks WHERE slug = 'c-cpp';

-- NOTE: Do not add seed questions here — they will be added by teachers through the dashboard.
-- The assessment system requires at least 2 beginner + 2 intermediate + 1 advanced questions per track.
