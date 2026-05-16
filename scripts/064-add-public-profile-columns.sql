-- =====================================================
-- 064-add-public-profile-columns
-- =====================================================
-- Backfill for migrations 046, 047, 048 — the public passport /
-- public instructor / verified examiner columns on users that the
-- production database is missing. The codebase has been referencing
-- these columns for months but Postgres logs show "column
-- users.public_passport_handle does not exist" 500s on
-- /practitioners, /p/[handle], /sitemap.xml, and the admin students
-- API (Batch F threaded these through). Those errors trigger blank
-- screens because /ockock and /(ockock) didn't have error boundaries
-- until this batch.
--
-- This single migration consolidates 046+047+048 into one file
-- because they were never applied separately. Idempotent — uses
-- IF NOT EXISTS / CREATE INDEX IF NOT EXISTS / DROP POLICY IF
-- EXISTS so re-runs are safe.

-- ---------------------------------------------------------------
-- 046-add-public-passport
-- ---------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS public_passport_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_passport_handle TEXT,
  ADD COLUMN IF NOT EXISTS public_passport_bio TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_public_passport_handle_unique
  ON public.users (public_passport_handle)
  WHERE public_passport_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_public_passport_enabled_idx
  ON public.users (public_passport_enabled)
  WHERE public_passport_enabled = TRUE;

COMMENT ON COLUMN public.users.public_passport_enabled IS
  'Explicit opt-in for the public passport page at /p/[handle]. Off by default.';
COMMENT ON COLUMN public.users.public_passport_handle IS
  'URL slug for the passport. Unique. e.g. "khun-pong-23".';

-- ---------------------------------------------------------------
-- 047-add-public-instructor
-- ---------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS public_instructor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_instructor_handle TEXT,
  ADD COLUMN IF NOT EXISTS public_instructor_bio TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_public_instructor_handle_unique
  ON public.users (public_instructor_handle)
  WHERE public_instructor_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_public_instructor_enabled_idx
  ON public.users (public_instructor_enabled)
  WHERE public_instructor_enabled = TRUE;

COMMENT ON COLUMN public.users.public_instructor_enabled IS
  'Opt-in for the public instructor profile at /i/[handle]. Independent of public_passport_*.';
COMMENT ON COLUMN public.users.public_instructor_handle IS
  'URL slug for the instructor profile. Independent of public_passport_handle.';

-- ---------------------------------------------------------------
-- 048-add-verified-examiner
-- ---------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_verified_examiner BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_examiner_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_examiner_by_user_id UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS users_verified_examiner_idx
  ON public.users (is_verified_examiner)
  WHERE is_verified_examiner = TRUE;

-- Combined lookup for the passport/instructor pages that join
-- verified-examiner status with handle.
CREATE INDEX IF NOT EXISTS users_public_passport_handle_lookup_idx
  ON public.users (public_passport_handle, public_passport_enabled)
  WHERE public_passport_enabled = TRUE AND public_passport_handle IS NOT NULL;

COMMENT ON COLUMN public.users.is_verified_examiner IS
  'Federation-verified examiner badge — shown next to their name on /i/[handle] and /verify/[cert]. Granted by platform admin.';

-- ---------------------------------------------------------------
-- RLS additions for public read of opted-in handles
-- ---------------------------------------------------------------
-- Anyone can SELECT users with public_passport_enabled=TRUE OR
-- public_instructor_enabled=TRUE. This lets the public passport +
-- instructor pages render without auth. The check restricts what's
-- visible to those opt-in rows specifically.
DROP POLICY IF EXISTS users_public_passport_read ON public.users;
CREATE POLICY users_public_passport_read ON public.users
  FOR SELECT
  USING (public_passport_enabled = TRUE OR public_instructor_enabled = TRUE);
