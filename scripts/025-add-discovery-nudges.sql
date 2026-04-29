-- ============================================
-- 025: Snooze / nudge tracking on discovered_gyms
-- ============================================
-- Adds last_nudged_at so the Today panel can stop nagging the operator
-- about pending invites they've already followed up on. The Today
-- query filters: pending invites where (last_nudged_at IS NULL OR
-- last_nudged_at < now() - 7d).
-- ============================================

ALTER TABLE discovered_gyms
  ADD COLUMN IF NOT EXISTS last_nudged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_discovered_gyms_last_nudged_at
  ON discovered_gyms(last_nudged_at);
