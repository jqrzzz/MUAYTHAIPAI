-- ============================================
-- 077 · Editable certification skills (reword v1)
-- ============================================
-- The Naga→Garuda assessment criteria ("skills") have lived hardcoded in
-- lib/certification-levels.ts. This table lets a platform operator reword them
-- without a deploy, network-wide.
--
-- IMPORTANT — index integrity: skill_signoffs reference a skill by its integer
-- `skill_index` (position in the level's ordered list). So this v1 supports
-- REWORD ONLY: each row's `position` is fixed and equals that skill_index.
-- Rewording changes only the text — counts, ordering, and every historical
-- sign-off stay valid. (Add/remove/reorder is a separate, larger change that
-- must also migrate the issuance count + sign-off UI together.)
--
-- Seeded from the exact code defaults so nothing changes until an operator edits.
-- A reader (lib/cert-skills.ts) falls back to the code arrays for any level with
-- no rows here, so the app behaves identically before this migration is run.

CREATE TABLE IF NOT EXISTS cert_level_skills (
  level_id   TEXT NOT NULL,
  position   INTEGER NOT NULL,        -- equals skill_signoffs.skill_index
  skill      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (level_id, position)
);

ALTER TABLE cert_level_skills ENABLE ROW LEVEL SECURITY;

-- The cert standard is public reference data (shown on verify pages, gym pages,
-- enrolment, etc.), so anyone may read it. Writes happen only via the
-- service-role platform-admin API, which bypasses RLS — no write policy needed.
DROP POLICY IF EXISTS "cert_level_skills public read" ON cert_level_skills;
CREATE POLICY "cert_level_skills public read"
  ON cert_level_skills FOR SELECT
  USING (true);

-- ---- Seed from lib/certification-levels.ts (position = array index) ----
INSERT INTO cert_level_skills (level_id, position, skill) VALUES
  ('naga', 0, 'Basic Muay Thai stance (guard position)'),
  ('naga', 1, 'Jab and cross (mat wiang)'),
  ('naga', 2, 'Front kick (teep)'),
  ('naga', 3, 'Basic shin block'),
  ('naga', 4, 'Wai Kru knowledge and respect'),
  ('naga', 5, 'Basic pad work etiquette'),
  ('naga', 6, 'Understanding of Muay Thai history'),

  ('phayra-nak', 0, '3-strike combinations (jab-cross-kick)'),
  ('phayra-nak', 1, 'Footwork patterns (angles, pivots)'),
  ('phayra-nak', 2, 'Basic clinch entry and control'),
  ('phayra-nak', 3, 'Defensive counters (catch and return)'),
  ('phayra-nak', 4, 'Elbow strikes (sok tat, sok ti)'),
  ('phayra-nak', 5, 'Knee strikes from range (khao trong)'),
  ('phayra-nak', 6, 'Conditioning fundamentals (skipping, shadow boxing)'),

  ('singha', 0, 'Advanced striking power (hip rotation, weight transfer)'),
  ('singha', 1, 'Clinch sweeps and dumps'),
  ('singha', 2, 'Sparring fundamentals (controlled contact)'),
  ('singha', 3, 'Fight strategy (distance management)'),
  ('singha', 4, 'Advanced knee techniques (khao khong, khao loi)'),
  ('singha', 5, 'Body kick defense and counter'),
  ('singha', 6, 'Mental fortitude under pressure'),
  ('singha', 7, 'Basic pad holding for partners'),

  ('hanuman', 0, 'Advanced clinch transitions and sweeps'),
  ('hanuman', 1, 'Fight planning and ring strategy'),
  ('hanuman', 2, 'Full sparring (controlled)'),
  ('hanuman', 3, 'High-intensity conditioning circuits'),
  ('hanuman', 4, 'Elbow combinations in close range'),
  ('hanuman', 5, 'Advanced pad holding technique'),
  ('hanuman', 6, 'Competition readiness assessment'),
  ('hanuman', 7, 'Understanding of Muay Boran fundamentals'),
  ('hanuman', 8, 'Cornering and fight reading basics'),

  ('garuda', 0, 'Elite speed and precision striking'),
  ('garuda', 1, 'Full sparring proficiency'),
  ('garuda', 2, 'Advanced clinch mastery (all positions)'),
  ('garuda', 3, 'Teaching demonstration (lead a drill)'),
  ('garuda', 4, 'Spiritual and cultural connection to Muay Thai'),
  ('garuda', 5, 'Muay Boran technique demonstration'),
  ('garuda', 6, 'Mentorship — coach a beginner through basics'),
  ('garuda', 7, 'Ram Muay performance'),
  ('garuda', 8, 'Written knowledge assessment (history, rules, culture)'),
  ('garuda', 9, 'Comprehensive physical assessment')
ON CONFLICT (level_id, position) DO NOTHING;
