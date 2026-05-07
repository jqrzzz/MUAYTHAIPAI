-- Liability waivers
-- Version: 1.0.0  (Wave 12: industry-standard gym SaaS — waivers)
--
-- Every gym in the world that does contact sport requires a liability
-- waiver before a student steps on the mat. Today gyms hand out paper.
-- This migration brings the waiver online: the gym owner publishes a
-- waiver text (they can edit + version it over time), and each student
-- signs once (typed name as signature) before their first class. The
-- signature is recorded with timestamp + IP + user-agent so the gym
-- has audit trail if anything goes wrong.
--
-- Design notes:
--   - org_waivers stores the waiver TEXT versioned by `version` integer.
--     New text → bump version. Older versions stay around for audit.
--   - student_waiver_signatures stamps a student's signature against a
--     specific waiver_id. If the gym updates the waiver, the student
--     theoretically should re-sign — surfaced in /admin as "outdated
--     signature" later (out of scope for v1).
--   - Public can SELECT the latest active waiver of a gym (the student
--     needs to read it before signing) but ONLY service role can insert
--     signatures (we do this server-side from /api/student/sign-waiver
--     to capture IP + UA correctly).

CREATE TABLE IF NOT EXISTS org_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One ACTIVE waiver per gym at a time — older versions get is_active
  -- set to FALSE when a new one is published.
  UNIQUE (org_id, version)
);

CREATE INDEX IF NOT EXISTS org_waivers_org_id_idx ON org_waivers (org_id);
CREATE INDEX IF NOT EXISTS org_waivers_active_idx ON org_waivers (org_id, is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS student_waiver_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  waiver_id UUID NOT NULL REFERENCES org_waivers(id) ON DELETE RESTRICT,

  -- Audit metadata (captured server-side, not trusted from the client)
  signed_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,

  -- One active signature per (gym, user, waiver_version)
  UNIQUE (org_id, user_id, waiver_id)
);

CREATE INDEX IF NOT EXISTS student_waiver_signatures_org_id_idx
  ON student_waiver_signatures (org_id);
CREATE INDEX IF NOT EXISTS student_waiver_signatures_user_id_idx
  ON student_waiver_signatures (user_id);

ALTER TABLE org_waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_waiver_signatures ENABLE ROW LEVEL SECURITY;

-- Anyone can read the active waiver of any gym (a prospective student
-- needs to see what they're signing before they sign in).
CREATE POLICY "Anyone reads active waivers"
  ON org_waivers FOR SELECT
  USING (is_active = TRUE OR has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Owners + admins manage waivers"
  ON org_waivers FOR ALL
  USING (has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "Platform admins full access waivers"
  ON org_waivers FOR ALL
  USING (is_platform_admin());

-- Signatures: gym staff can SELECT their gym's. Students can SELECT
-- their own. Service role inserts (we capture IP server-side).
CREATE POLICY "Gym staff reads their org's signatures"
  ON student_waiver_signatures FOR SELECT
  USING (has_org_role(org_id, ARRAY['owner','admin','trainer']));

CREATE POLICY "Students read their own signatures"
  ON student_waiver_signatures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Platform admins full access signatures"
  ON student_waiver_signatures FOR ALL
  USING (is_platform_admin());

CREATE TRIGGER org_waivers_updated_at
  BEFORE UPDATE ON org_waivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE org_waivers IS
  'Per-gym liability waiver text. Versioned — bump version when text changes. Students sign the active version before their first class.';
COMMENT ON TABLE student_waiver_signatures IS
  'Audit record of a student signing a specific waiver version. Includes IP + user-agent captured server-side for legal weight.';
