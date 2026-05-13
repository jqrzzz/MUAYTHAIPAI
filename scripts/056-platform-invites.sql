-- 056-platform-invites.sql — invites for platform-level access (the "partner"
-- tier added in 055). The existing `invites` table is gym-scoped (NOT NULL
-- org_id, RLS keyed on org_members), so platform-level invites need their
-- own thin table.

CREATE TABLE IF NOT EXISTS platform_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('full', 'partner')),
  token         TEXT UNIQUE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  accepted_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_platform_invites_token ON platform_invites(token);
CREATE INDEX IF NOT EXISTS idx_platform_invites_email ON platform_invites(lower(email));
-- One pending invite per email at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_invites_pending_email
  ON platform_invites(lower(email)) WHERE status = 'pending';

ALTER TABLE platform_invites ENABLE ROW LEVEL SECURITY;

-- Public read by token (the accept page reaches the row anonymously). Security
-- relies on the unguessable 32-char token, matching the gym `invites` table.
CREATE POLICY "Anyone can view platform invite by token"
  ON platform_invites FOR SELECT
  USING (true);

-- Only "full" platform admins can create/cancel invites — partners can't
-- promote others.
CREATE POLICY "Full platform admins create platform invites"
  ON platform_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.is_platform_admin = TRUE
        AND COALESCE(users.platform_admin_role, 'full') = 'full'
    )
  );

CREATE POLICY "Full platform admins update platform invites"
  ON platform_invites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.is_platform_admin = TRUE
        AND COALESCE(users.platform_admin_role, 'full') = 'full'
    )
  );

COMMENT ON TABLE platform_invites IS
  'Token-bearing invites to platform-admin access (parallel to the gym-scoped `invites` table). When accepted, sets users.is_platform_admin = TRUE with the invite''s role.';
