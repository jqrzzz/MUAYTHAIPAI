-- ============================================
-- 047: Public instructor profile
-- Version: 1.0.0  (Wave 26: examiner lineage made public)
--
-- Companion to /p/[handle] (public student passport). When a trainer
-- opts in, /i/[handle] renders a public profile that names them as an
-- examiner: who they are, where they teach, what they've graded.
--
-- Why on `users` instead of `trainer_profiles`?
--   - A single user can be a trainer at multiple gyms (multiple
--     trainer_profile rows). The public identity is the PERSON, not
--     the gym affiliation. One URL → one person.
--   - The page itself aggregates across all their trainer_profile rows.
--
-- Decoupled from passport opt-in: a user can have a public passport
-- (as a student) AND a public instructor page (as a trainer), or
-- either alone, or neither.
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS public_instructor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_instructor_handle TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_public_instructor_handle_unique
  ON users (public_instructor_handle)
  WHERE public_instructor_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_public_instructor_enabled_idx
  ON users (public_instructor_enabled)
  WHERE public_instructor_enabled = TRUE;

COMMENT ON COLUMN users.public_instructor_enabled IS
  'Opt-in. When TRUE, /i/[handle] renders the user as a public instructor.';
COMMENT ON COLUMN users.public_instructor_handle IS
  'URL slug for the instructor profile. Independent of public_passport_handle.';
