-- ============================================
-- 043: Platform signals — proactive AI insights
-- Version: 1.0.0  (Wave 22: AI-native daily brief)
--
-- Daily cron generates "signals" — anomalies, churn risks, trial
-- expirations, success milestones, outreach opportunities. The
-- operator opens /platform-admin/today and sees the brief instead of
-- having to hunt across tabs for what matters today.
--
-- Each signal has:
--   - a kind (churn_risk / anomaly / trial / past_due / celebration /
--     outreach / sla)
--   - a severity (info / warning / critical)
--   - human-readable title + summary written by AI (or template)
--   - structured evidence (JSONB — supporting numbers, dates, links)
--   - optional suggested_action + action_payload for one-tap execution
--
-- Lifecycle:
--   open       → just generated, awaiting operator review
--   dismissed  → operator acknowledged, no action needed (or false alarm)
--   acted_on   → operator took the suggested action
--   stale      → generator removed it on a later run (e.g. trial converted)
--
-- Idempotency: each (target_org_id, kind, dedup_key) tuple gets at
-- most one open signal at a time. The cron upserts on this so a
-- single trial-expiring signal doesn't spawn 7 daily duplicates.
-- ============================================

CREATE TABLE IF NOT EXISTS platform_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What kind of signal. Snake_case, used for filtering + icon mapping.
  kind TEXT NOT NULL,
  -- info | warning | critical
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),

  -- The gym this signal is about. NULL = network-wide (no specific gym)
  target_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Display
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  /** Optional longer detail shown when the operator expands the signal. */
  detail TEXT,

  -- Structured evidence for the UI (numbers, dates, deeplinks)
  evidence JSONB DEFAULT '{}'::jsonb,

  -- Suggested next step (human-readable). Optional but encouraged.
  suggested_action TEXT,
  /** If we can execute the action automatically with one tap, what
   *  payload describes it? e.g. { kind: 'send_email', template: 'trial_end' }
   *  Reserved for Phase 2 — Phase 1 just shows the suggestion text. */
  action_payload JSONB,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'dismissed', 'acted_on', 'stale')),

  -- Deduplication key so daily cron doesn't spawn duplicates. Convention:
  -- the cron computes a key like "trial-ending-2025-06-15" for a
  -- specific gym + scenario; upserts on (target_org_id, kind, dedup_key).
  dedup_key TEXT,

  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  /** Auto-stale signals older than this if the cron didn't re-emit. */
  expires_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acted_at TIMESTAMPTZ,
  acted_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (target_org_id, kind, dedup_key)
);

CREATE INDEX IF NOT EXISTS platform_signals_open_idx
  ON platform_signals (severity, generated_at DESC)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS platform_signals_target_idx
  ON platform_signals (target_org_id, status, generated_at DESC)
  WHERE target_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS platform_signals_kind_idx
  ON platform_signals (kind, status);

ALTER TABLE platform_signals ENABLE ROW LEVEL SECURITY;

-- Only platform admins read. Writes go through the cron / API via the
-- service role.
CREATE POLICY "Platform admins manage signals"
  ON platform_signals FOR ALL
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE TRIGGER platform_signals_updated_at
  BEFORE UPDATE ON platform_signals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE platform_signals IS
  'AI-driven proactive insights for the platform operator. Generated daily by /api/cron/generate-platform-signals.';
