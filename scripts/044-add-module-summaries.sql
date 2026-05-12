-- ============================================
-- 044: Course module AI summaries
-- Version: 1.0.0  (Wave 23: premium course polish)
--
-- Each module gets an optional 2-3 sentence AI-generated summary that
-- sets the scene for students before they dive into the lessons.
-- Surfaces at the top of every module on the course page + study pack.
--
-- summary_generated_at tracks staleness so the gym admin can regenerate
-- after editing lessons (and we can show "summary from 3 days ago,
-- lessons updated since — regenerate?" in v2).
-- ============================================

ALTER TABLE course_modules
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN course_modules.summary IS
  '2-3 sentence student-facing summary. AI-generated, operator-editable.';
COMMENT ON COLUMN course_modules.summary_generated_at IS
  'When the summary was last generated. NULL = manually written or never set.';
