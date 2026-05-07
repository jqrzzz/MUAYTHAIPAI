-- ============================================
-- 037: Lesson media (images + videos)
-- Version: 1.0.0  (Wave 16: course media uploads)
--
-- Two changes:
--   1. Add hero_image_url + gallery JSONB to the lessons table so an
--      operator can attach a thumbnail and multiple step-by-step photos
--      per lesson.
--   2. Provision two public storage buckets (course-media for images,
--      course-videos for video files) plus the RLS policies that govern
--      who can write to which path.
--
-- Path convention enforced by RLS:
--   platform/{course_id}/{lesson_id}/{filename}     ← only platform admins
--   org/{org_id}/{course_id}/{lesson_id}/{filename} ← only that org's owner/admin
--
-- Reads are public — student playback shouldn't require auth (we'll
-- enforce enrollment at the React layer; the URL itself isn't a secret).
-- ============================================

-- ─── 1. Lessons schema ──────────────────────────────────────────────
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  -- gallery: array of { url, caption?, alt? }. JSONB lets us add fields
  -- (e.g. order_index, AI-generated caption) without migrations.
  ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN lessons.hero_image_url IS
  'Lesson cover/thumbnail. Renders above the video on the student view.';
COMMENT ON COLUMN lessons.gallery IS
  'Array of {url, caption?, alt?}. Photo gallery shown after the body content.';

-- ─── 2. Buckets ────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'course-media',
    'course-media',
    TRUE,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'course-videos',
    'course-videos',
    TRUE,
    524288000, -- 500 MB. Long-form lecture videos handled.
    ARRAY['video/mp4', 'video/webm', 'video/quicktime']
  )
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 3. RLS — public read ──────────────────────────────────────────
DROP POLICY IF EXISTS "course media public read" ON storage.objects;
CREATE POLICY "course media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('course-media', 'course-videos'));

-- ─── 4. RLS — authorized upload ────────────────────────────────────
DROP POLICY IF EXISTS "course media authorized upload" ON storage.objects;
CREATE POLICY "course media authorized upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('course-media', 'course-videos')
    AND (
      -- Platform-wide course: only platform admins
      ((storage.foldername(name))[1] = 'platform' AND is_platform_admin())
      OR
      -- Gym-specific course: only that gym's owner or admin
      (
        (storage.foldername(name))[1] = 'org'
        AND has_org_role(((storage.foldername(name))[2])::uuid, ARRAY['owner', 'admin'])
      )
    )
  );

-- ─── 5. RLS — authorized delete ────────────────────────────────────
DROP POLICY IF EXISTS "course media authorized delete" ON storage.objects;
CREATE POLICY "course media authorized delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('course-media', 'course-videos')
    AND (
      ((storage.foldername(name))[1] = 'platform' AND is_platform_admin())
      OR
      (
        (storage.foldername(name))[1] = 'org'
        AND has_org_role(((storage.foldername(name))[2])::uuid, ARRAY['owner', 'admin'])
      )
    )
  );
