-- ============================================
-- 045: Email automation — sequences + send log
-- Version: 1.0.0  (Wave 24: drip campaigns + AI-driven retention)
--
-- Adds the foundation for automated email sequences:
--   - Welcome series (new student joins a gym → day 1 + day 7 emails)
--   - Lapsed re-engagement (no booking 30 days → one-time nudge)
--   - Certificate congratulations (cert issued → 24h follow-up)
--
-- email_send_log: one row per email actually sent. The UNIQUE
-- constraint on (recipient_user_id, sequence, trigger_ref) provides
-- idempotency — same person can't get the same welcome email twice
-- even if the cron runs daily for years.
--
-- Per-org opt-out: gyms toggle sequences via org_settings.email_*
-- columns added below. Default opt-IN — but a gym can turn off any
-- sequence if it doesn't fit their voice.
-- ============================================

CREATE TABLE IF NOT EXISTS email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who got it
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- What sequence + step (e.g. 'welcome.day1', 'welcome.day7',
  -- 'lapsed.day30', 'cert.issued'). Convention: snake_case, dotted.
  sequence TEXT NOT NULL,

  -- Reference to the triggering entity so we can dedupe per-trigger.
  -- For welcome: trigger_ref = membership_id. For cert: cert_id.
  -- For lapsed: composite "user_id:YYYY-MM" so re-engagement is monthly.
  trigger_ref TEXT NOT NULL,

  -- Resend message ID for support / debugging
  resend_message_id TEXT,

  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'failed', 'skipped', 'bounced')),
  error_message TEXT,

  -- Optional metadata — body preview, gym name, level name, anything
  -- useful for audit + the per-gym "what got sent" view.
  metadata JSONB,

  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Idempotency. Without this the daily cron would spam.
  UNIQUE (recipient_user_id, sequence, trigger_ref)
);

CREATE INDEX IF NOT EXISTS email_send_log_org_recent_idx
  ON email_send_log (org_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS email_send_log_sequence_idx
  ON email_send_log (sequence, sent_at DESC);

ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins read all email log"
  ON email_send_log FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "Org admins read their gym's email log"
  ON email_send_log FOR SELECT
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

-- ─── Per-org opt-out toggles ────────────────────────────────────
-- Add to org_settings (each gym opts in / out of each sequence).
-- Default all to TRUE — opt-in by default, opt-out per gym.

ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS email_welcome_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_lapsed_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_cert_congrats_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON TABLE email_send_log IS
  'Idempotent log of automated emails sent by the daily sequence cron.';
COMMENT ON COLUMN email_send_log.trigger_ref IS
  'Per-sequence dedup key. welcome → membership_id; cert → cert_id; lapsed → user_id:YYYY-MM.';
