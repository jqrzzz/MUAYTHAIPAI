-- 057-boardroom.sql — the Boardroom: a tiny shared workspace for the platform
-- admin + partner(s). Upload the business plan / pitch deck / financial model,
-- jot running notes, and discuss. Nothing fancy.
--
-- Both "full" and "partner" platform admins can read and write everything here
-- (it's a 2-person ops space; permission gymnastics aren't worth it).

CREATE TABLE IF NOT EXISTS boardroom_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type    TEXT,
  size_bytes   BIGINT,
  uploaded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One running notes doc — singleton enforced by the CHECK + PK.
CREATE TABLE IF NOT EXISTS boardroom_notes (
  id          SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  body        TEXT NOT NULL DEFAULT '',
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO boardroom_notes (id, body) VALUES (1, '') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS boardroom_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boardroom_files_created    ON boardroom_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boardroom_comments_created ON boardroom_comments(created_at DESC);

ALTER TABLE boardroom_files    ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardroom_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardroom_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins read boardroom_files"  ON boardroom_files
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE));
CREATE POLICY "Platform admins write boardroom_files" ON boardroom_files
  FOR ALL
  USING      (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE));

CREATE POLICY "Platform admins read boardroom_notes"  ON boardroom_notes
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE));
CREATE POLICY "Platform admins write boardroom_notes" ON boardroom_notes
  FOR ALL
  USING      (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE));

CREATE POLICY "Platform admins read boardroom_comments"  ON boardroom_comments
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE));
CREATE POLICY "Platform admins write boardroom_comments" ON boardroom_comments
  FOR ALL
  USING      (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE));

-- Private storage bucket. The API routes gate access (service-role for storage
-- operations; the API itself checks requirePlatformAdmin), and the page renders
-- short-lived signed URLs for downloads — so no separate storage.objects RLS is
-- needed.
INSERT INTO storage.buckets (id, name, public)
VALUES ('boardroom', 'boardroom', false)
ON CONFLICT (id) DO NOTHING;
