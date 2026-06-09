-- ============================================
-- 078 · Per-gym OckOck voice (concierge persona)
-- ============================================
-- The deck promises OckOck "answers in your gym's voice," but the concierge
-- system prompt was global — every gym's AI had the same personality, only the
-- knowledge base (services, FAQs, hours, trainers) varied. This table lets each
-- gym shape OckOck's voice, opening line, language preference, and house rules.
--
-- Read by the concierge via the public-chat service-role client (bypasses RLS),
-- so reads "just work" for anonymous visitors. RLS below only governs the
-- gym-admin editor: members read their gym's row, owners/admins write it.
--
-- One row per org. Safe to run before the editor ships — absent/blank rows just
-- fall back to OckOck's default voice.

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
