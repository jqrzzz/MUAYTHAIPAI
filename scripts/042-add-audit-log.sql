-- ============================================
-- 042: Platform audit log
-- Version: 1.0.0  (Wave 21: who-did-what trail)
--
-- Captures sensitive platform-operator actions:
--   - Impersonation (view-as start/end)
--   - Gym payouts settled
--   - Bookings refunded (manual)
--   - Subscriptions overridden (manual status/price changes)
--   - Blacklist add/remove
--   - Support replies sent
--   - Manual data edits via platform-admin
--
-- The point is debugging + compliance + sanity-checking yourself when
-- you ask "wait, did I really do that?"
--
-- Append-only by design. We never UPDATE or DELETE rows here; mistakes
-- are corrected by inserting a new entry with action='correction'.
-- ============================================

CREATE TABLE IF NOT EXISTS platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who acted. user_id may be NULL if the action was system-driven
  -- (e.g. a cron job). actor_email is denormalized so the audit view
  -- works even if the user is later deleted.
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,

  -- What they did. Free-form to keep the table flexible — convention:
  -- snake_case, namespaced by domain (e.g. 'impersonate.start',
  -- 'payout.settle', 'blacklist.add', 'support.reply').
  action TEXT NOT NULL,

  -- What they did it to. target_type + target_id is the canonical
  -- pointer. target_label is denormalized (gym name, user email, etc.)
  -- so the audit view doesn't need joins to be readable.
  target_type TEXT,
  target_id UUID,
  target_label TEXT,

  -- Anything else worth recording — old/new values, amount, reason.
  metadata JSONB,

  -- For incident response
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS platform_audit_log_created_idx
  ON platform_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_log_actor_idx
  ON platform_audit_log (actor_user_id, created_at DESC)
  WHERE actor_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS platform_audit_log_target_idx
  ON platform_audit_log (target_type, target_id, created_at DESC)
  WHERE target_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS platform_audit_log_action_idx
  ON platform_audit_log (action, created_at DESC);

ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;

-- Only platform admins read; writes happen via service role from the
-- API helpers (so we don't accidentally write from a client).
CREATE POLICY "Platform admins read audit log"
  ON platform_audit_log FOR SELECT
  USING (is_platform_admin());

COMMENT ON TABLE platform_audit_log IS
  'Append-only log of sensitive platform-operator actions. Service-role writes only.';
