-- ============================================
-- 046: Public student passport
-- Version: 1.0.0  (Wave 25: shareable cert credibility)
--
-- A student passport is a public, verifiable, portable profile of a
-- student's certifications + journey. Lives at /p/[handle].
--
-- Three columns on users:
--   public_passport_enabled — explicit opt-in (off by default; not
--                              everyone wants their cert journey public)
--   public_passport_handle  — URL slug, unique. e.g. "khun-pong-23"
--   public_passport_bio     — short bio in the student's voice
--
-- We DON'T expose the raw user_id in the URL — handle is the public
-- identifier, decoupled from auth ID. If a student deletes their
-- account, the handle frees up.
--
-- RLS: anyone can read users where public_passport_enabled=true (just
-- the safe public fields). Other reads still require auth.
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS public_passport_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_passport_handle TEXT,
  ADD COLUMN IF NOT EXISTS public_passport_bio TEXT;

-- Partial unique index — only enforced when handle is set. Lets users
-- clear their handle without conflicting with reserved/empty values.
CREATE UNIQUE INDEX IF NOT EXISTS users_public_passport_handle_unique
  ON users (public_passport_handle)
  WHERE public_passport_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_public_passport_enabled_idx
  ON users (public_passport_enabled)
  WHERE public_passport_enabled = TRUE;

COMMENT ON COLUMN users.public_passport_enabled IS
  'Opt-in. When TRUE, the student passport is publicly viewable at /p/[handle].';
COMMENT ON COLUMN users.public_passport_handle IS
  'URL slug for the public passport. Lowercase, hyphens. Globally unique.';
COMMENT ON COLUMN users.public_passport_bio IS
  'Short student-written bio for the passport page. Max 400 chars enforced in API.';
