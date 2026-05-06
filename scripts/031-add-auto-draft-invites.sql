-- Auto-drafted invite letters for discovered gyms
-- Version: 1.0.0  (Wave 11: autonomous outreach pipeline)
--
-- After the auto-enrich cron pulls services + contact info from a
-- discovered gym's website, the auto-draft cron writes a personalized
-- invite letter (subject + body) tailored to what we now know about
-- that gym — its name, location, vibe, services. The draft sits here
-- waiting for the operator to approve + send.
--
-- Why columns on discovered_gyms vs a separate drafts table: the draft
-- is 1:1 with the gym, only one draft at a time, and lives in the same
-- lifecycle (discovered → enriched → drafted → invited → onboarded).
-- Inlining keeps the model honest without adding a join.

ALTER TABLE discovered_gyms
  ADD COLUMN IF NOT EXISTS auto_draft_subject TEXT,
  ADD COLUMN IF NOT EXISTS auto_draft_body TEXT,
  ADD COLUMN IF NOT EXISTS auto_drafted_at TIMESTAMPTZ;

COMMENT ON COLUMN discovered_gyms.auto_draft_subject IS
  'AI-generated personalized invite email subject. Ready for operator approval. NULL = not drafted yet.';
COMMENT ON COLUMN discovered_gyms.auto_draft_body IS
  'AI-generated personalized invite email body (plain text). Ready for operator approval. NULL = not drafted yet.';
COMMENT ON COLUMN discovered_gyms.auto_drafted_at IS
  'When the auto-draft was generated. NULL = not drafted yet. Used by the cron to skip already-drafted gyms.';
