-- ============================================
-- 048: Verified examiner + registry indexes
-- Version: 1.0.0  (Wave 27: institutional trust signal)
--
-- Platform admin can flip a flag on an instructor to grant them a
-- "Verified Examiner" badge — a shield icon on /i/[handle] and next
-- to their name on /verify pages. The signal that the federation has
-- personally vetted this grader.
--
-- This is a higher trust tier than "opted in to public profile" —
-- anyone with credentials can opt in; only the platform admin can
-- verify. Think Twitter blue check, but for Muay Thai grading.
--
-- Also adds indexes to back the new public registry pages
-- (/practitioners + /instructors) so the lists stay fast as the
-- network grows.
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_verified_examiner BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_examiner_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_examiner_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_examiner_note TEXT;

CREATE INDEX IF NOT EXISTS users_verified_examiner_idx
  ON users (is_verified_examiner)
  WHERE is_verified_examiner = TRUE;

-- The registry-supporting indexes (already partial-conditional on the
-- opt-in flags so they stay small)
CREATE INDEX IF NOT EXISTS users_public_passport_handle_lookup_idx
  ON users (public_passport_handle, public_passport_enabled)
  WHERE public_passport_enabled = TRUE AND public_passport_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_public_instructor_handle_lookup_idx
  ON users (public_instructor_handle, public_instructor_enabled)
  WHERE public_instructor_enabled = TRUE AND public_instructor_handle IS NOT NULL;

COMMENT ON COLUMN users.is_verified_examiner IS
  'Platform-admin-granted trust tier. Renders the shield badge on public profiles + verify pages.';
COMMENT ON COLUMN users.verified_examiner_at IS
  'When the badge was granted. NULL when revoked or never granted.';
COMMENT ON COLUMN users.verified_examiner_by IS
  'Which platform admin granted the verification.';
COMMENT ON COLUMN users.verified_examiner_note IS
  'Optional reason / lineage note recorded with the verification.';
