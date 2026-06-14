-- Port of scripts/078-gym-ai-persona.sql, which was never applied to prod
-- (verified live 2026-06-10: the table does not exist, so the Train-OckOck
-- persona editor and the concierge's per-gym voice have been silently
-- broken — every save 404s and the concierge always uses the default voice).
-- Content identical to the script; idempotent.
CREATE TABLE IF NOT EXISTS gym_ai_persona (
  org_id        UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  voice         TEXT,                       -- how OckOck should sound for this gym
  greeting      TEXT,                       -- optional custom opening line
  language_mode TEXT NOT NULL DEFAULT 'thai_first'
                CHECK (language_mode IN ('thai_first', 'english_first', 'mirror')),
  guidelines    TEXT,                       -- always-do / never-do house rules
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gym_ai_persona ENABLE ROW LEVEL SECURITY;

-- Members of the gym can read their own persona (for the editor).
DROP POLICY IF EXISTS "gym_ai_persona_select" ON gym_ai_persona;
CREATE POLICY "gym_ai_persona_select" ON gym_ai_persona
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Owners + admins can create / update it.
DROP POLICY IF EXISTS "gym_ai_persona_write" ON gym_ai_persona;
CREATE POLICY "gym_ai_persona_write" ON gym_ai_persona
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );
