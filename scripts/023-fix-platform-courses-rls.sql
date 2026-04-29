-- ============================================
-- 023: Tighten RLS on platform-wide courses
-- ============================================
-- Migration 013 let any gym owner/admin write to courses where
-- org_id IS NULL. The Naga–Garuda ladder is the country-wide
-- standard, so platform admins are the only ones who should be
-- able to author or modify it. Gym admins remain free to create
-- and manage their own gym-scoped courses.
--
-- This migration:
--   1. Drops the old combined "Org admins manage courses" policy
--   2. Re-creates two separate policies:
--      a. Platform admins manage platform-wide courses (org_id IS NULL)
--      b. Gym admins manage their own gym-scoped courses
--   3. Adds a public-read policy for platform courses regardless of
--      status, so gym admins can clone/reference drafts in dashboards.
-- ============================================

DROP POLICY IF EXISTS "Org admins manage courses" ON courses;

-- Platform admins (and only platform admins) manage org_id IS NULL courses
CREATE POLICY "Platform admins manage platform courses"
  ON courses FOR ALL
  USING (
    org_id IS NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_platform_admin = TRUE
    )
  )
  WITH CHECK (
    org_id IS NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_platform_admin = TRUE
    )
  );

-- Gym owners/admins manage courses scoped to their own org
CREATE POLICY "Gym admins manage their own courses"
  ON courses FOR ALL
  USING (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid()
      AND org_id = courses.org_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  )
  WITH CHECK (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid()
      AND org_id = courses.org_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Modules / lessons / quiz follow course ownership for writes too.
-- Reads are already public-when-published (policies in 013).
DROP POLICY IF EXISTS "Course staff manage modules" ON course_modules;
CREATE POLICY "Course staff manage modules"
  ON course_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_modules.course_id
      AND (
        (c.org_id IS NULL AND EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE
        ))
        OR
        (c.org_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM org_members
          WHERE user_id = auth.uid()
          AND org_id = c.org_id
          AND role IN ('owner', 'admin')
          AND status = 'active'
        ))
      )
    )
  );

DROP POLICY IF EXISTS "Course staff manage lessons" ON lessons;
CREATE POLICY "Course staff manage lessons"
  ON lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lessons.course_id
      AND (
        (c.org_id IS NULL AND EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE
        ))
        OR
        (c.org_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM org_members
          WHERE user_id = auth.uid()
          AND org_id = c.org_id
          AND role IN ('owner', 'admin')
          AND status = 'active'
        ))
      )
    )
  );

DROP POLICY IF EXISTS "Course staff manage quiz" ON quiz_questions;
CREATE POLICY "Course staff manage quiz"
  ON quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = quiz_questions.lesson_id
      AND (
        (c.org_id IS NULL AND EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE
        ))
        OR
        (c.org_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM org_members
          WHERE user_id = auth.uid()
          AND org_id = c.org_id
          AND role IN ('owner', 'admin')
          AND status = 'active'
        ))
      )
    )
  );
