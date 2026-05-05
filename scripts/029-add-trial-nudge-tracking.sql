-- Trial-nudge bookkeeping
-- Version: 1.0.0  (Wave 9e: graduated trial-end communications)
--
-- Adds three timestamp columns so the daily trial-nudge cron is
-- idempotent and auditable. Each cron tick:
--   - If status='trial' AND trial_ends_at is 7 days away
--     AND trial_nudge_7d_sent_at IS NULL
--     → send the 7-day nudge, set trial_nudge_7d_sent_at = NOW()
--   - Same pattern for the 1-day and expired stages.
--
-- A gym whose owner upgrades early simply never matches the 7d/1d
-- conditions (status flips to 'active'). A gym whose owner stays on
-- trial gets each email exactly once.

ALTER TABLE gym_subscriptions
  ADD COLUMN IF NOT EXISTS trial_nudge_7d_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_nudge_1d_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_nudge_expired_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN gym_subscriptions.trial_nudge_7d_sent_at IS
  'When the 7-days-left email was sent. Idempotency guard for the daily cron.';
COMMENT ON COLUMN gym_subscriptions.trial_nudge_1d_sent_at IS
  'When the 1-day-left email was sent.';
COMMENT ON COLUMN gym_subscriptions.trial_nudge_expired_sent_at IS
  'When the trial-ended email was sent.';
