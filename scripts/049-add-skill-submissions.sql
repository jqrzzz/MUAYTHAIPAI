-- ============================================
-- 049: Skill submissions (video demonstrations + review queue)
-- Version: 1.0.0  (Wave 26: from honor-system to verified)
--
-- Today, a trainer ticks off skill_signoffs based on watching a student
-- in class. That works, but it's invisible to the outside world — a
-- handwave on the verify page. To make the credential genuinely
-- defensible we need *evidence*: a short clip of the student
-- demonstrating the skill, reviewed by a named examiner, attached
-- forever to the verify record.
--
-- This migration adds:
--   1. skill_submissions table — one row per (student, level, skill_index)
--      capturing the video URL, student notes, current status, and the
--      reviewer's verdict.
--   2. Storage bucket "skill-submissions" with RLS:
--        * Students write to org/{org_id}/{user_id}/...
--        * Staff at the org can read/delete
--        * Public can read approved files (so /verify can embed the clip)
--
-- The approval handler (API layer) is responsible for INSERTing the
-- matching skill_signoffs row when status flips to 'approved'. We don't
-- do it in a trigger so the API can attribute the signoff to the
-- reviewer and pipe through logAudit.
-- ============================================

-- ─── 1. Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level TEXT NOT NULL,             -- e.g. 'naga', 'phayra-nak'
  skill_index INTEGER NOT NULL,    -- index into CERTIFICATION_LEVELS[level].skills

  video_url TEXT NOT NULL,         -- public URL into the skill-submissions bucket
  student_notes TEXT,              -- optional self-comment ("right knee was tight")

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'sent_back')),

  reviewer_id UUID REFERENCES users(id),   -- nullable until reviewed
  reviewer_notes TEXT,
  decided_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only ONE active submission per (student, level, skill_index). If a
-- student wants to resubmit after a rejection we'll let them by setting
-- the prior row's status to 'sent_back' or 'rejected' first.
CREATE UNIQUE INDEX IF NOT EXISTS skill_submissions_active_unique
  ON skill_submissions (org_id, student_id, level, skill_index)
  WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS skill_submissions_org_status_idx
  ON skill_submissions (org_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS skill_submissions_student_idx
  ON skill_submissions (student_id, level, skill_index);

COMMENT ON TABLE skill_submissions IS
  'Student-uploaded video demonstrations of certification skills. Reviewed by trainers/admins; approved submissions create a skill_signoffs row and badge the verify page.';

-- ─── 2. Bucket ─────────────────────────────────────────────────────
-- Public read so the verify page can render approved clips without
-- auth. Path RLS still gates writes/deletes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'skill-submissions',
  'skill-submissions',
  TRUE,
  104857600, -- 100 MB. Demos should be short — a single technique, not a class.
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 3. Storage RLS ────────────────────────────────────────────────
-- Path convention enforced below: org/{org_id}/{user_id}/{filename}

DROP POLICY IF EXISTS "skill submissions public read" ON storage.objects;
CREATE POLICY "skill submissions public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'skill-submissions');

DROP POLICY IF EXISTS "skill submissions student upload" ON storage.objects;
CREATE POLICY "skill submissions student upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'skill-submissions'
    AND (storage.foldername(name))[1] = 'org'
    AND (storage.foldername(name))[3] = auth.uid()::text
    -- Student must be a member of that org (any status — students
    -- aren't always 'active' org_members, but they have a row).
    AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = ((storage.foldername(name))[2])::uuid
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "skill submissions staff delete" ON storage.objects;
CREATE POLICY "skill submissions staff delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'skill-submissions'
    AND (storage.foldername(name))[1] = 'org'
    AND (
      -- Owner of the file
      (storage.foldername(name))[3] = auth.uid()::text
      -- or org staff
      OR has_org_role(((storage.foldername(name))[2])::uuid, ARRAY['owner', 'admin', 'trainer'])
      -- or platform admin
      OR is_platform_admin()
    )
  );

-- ─── 4. Table RLS ──────────────────────────────────────────────────
ALTER TABLE skill_submissions ENABLE ROW LEVEL SECURITY;

-- Students can read + insert their own submissions
DROP POLICY IF EXISTS skill_submissions_student ON skill_submissions;
CREATE POLICY skill_submissions_student ON skill_submissions
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Staff at the org can read + update (for reviewing)
DROP POLICY IF EXISTS skill_submissions_staff ON skill_submissions;
CREATE POLICY skill_submissions_staff ON skill_submissions
  USING (org_id IN (
    SELECT om.org_id FROM org_members om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  ));

-- Public read for approved submissions (so /verify can show the clip
-- without forcing the visitor to authenticate)
DROP POLICY IF EXISTS skill_submissions_public_approved ON skill_submissions;
CREATE POLICY skill_submissions_public_approved ON skill_submissions
  FOR SELECT
  USING (status = 'approved');

-- ─── 5. updated_at trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_skill_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS skill_submissions_updated_at ON skill_submissions;
CREATE TRIGGER skill_submissions_updated_at
  BEFORE UPDATE ON skill_submissions
  FOR EACH ROW EXECUTE FUNCTION set_skill_submissions_updated_at();
