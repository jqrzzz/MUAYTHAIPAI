-- ============================================
-- 071: Foreign keys for course content
--
-- course_modules and lessons were created without FK constraints, which
-- silently broke the Supabase nested-select used by the course detail
-- page (PostgREST needs a declared FK to embed `lessons (...)` inside a
-- course_modules query). The page received 0 modules and rendered a blank
-- curriculum with a false "Course Completed" state — even though the
-- content (modules + lessons + drills + quizzes) was fully populated.
--
-- Verified pre-apply: 0 orphan rows in either table, so these constraints
-- attach cleanly to existing data. ON DELETE CASCADE reflects the natural
-- ownership hierarchy: deleting a course removes its modules and lessons.
-- ============================================

ALTER TABLE course_modules
  ADD CONSTRAINT course_modules_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE lessons
  ADD CONSTRAINT lessons_module_id_fkey
  FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE;

ALTER TABLE lessons
  ADD CONSTRAINT lessons_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
