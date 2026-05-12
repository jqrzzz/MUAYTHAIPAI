-- ============================================
-- 052: Rate-limit buckets
-- Version: 1.0.0
--
-- Cheap per-(key, hour) counter for protecting AI + public endpoints
-- without standing up Redis. Each row is a single hour-bucket for a
-- single key (user_id, IP, etc.). We UPSERT-with-increment per request
-- and reject if count > limit.
--
-- expires_at + a cron-cleaned tail (or a partial index on recent rows)
-- keep the table small. We don't enforce expiry inline because the
-- ON CONFLICT-by-bucket pattern naturally limits each (key, hour) to
-- one row, and old rows are dead weight at worst.
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  -- The thing being limited (user id, IP, "user:UUID:endpoint" etc.).
  key TEXT NOT NULL,
  -- Start of the hour the count applies to (truncated to the hour).
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_expires
  ON rate_limit_buckets (expires_at);

COMMENT ON TABLE rate_limit_buckets IS
  'Per-(key, hour) request counter for AI + public endpoint rate limits.';

-- RLS disabled — only the service role writes here from server-side
-- code; no PostgREST exposure intended.
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS, so no policies are needed. We enable RLS
-- specifically to block anon/authenticated reads in case anyone ever
-- exposes the table accidentally.
