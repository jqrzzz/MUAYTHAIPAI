-- ============================================
-- 053: Atomic increment RPC for rate_limit_buckets
-- Version: 1.0.0
--
-- One-roundtrip UPSERT-and-increment so the limiter doesn't race with
-- itself. Concurrent requests for the same (key, window_start) each
-- get a unique post-increment count via the ON CONFLICT path.
--
-- Falls back to the JS-side two-roundtrip path in lib/rate-limit.ts if
-- this function isn't deployed for some reason — limiter degrades but
-- still works.
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key TEXT,
  p_window_start TIMESTAMPTZ,
  p_expires_at TIMESTAMPTZ
) RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO rate_limit_buckets (key, window_start, count, expires_at)
  VALUES (p_key, p_window_start, 1, p_expires_at)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = rate_limit_buckets.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

-- Service role calls this; revoke from anon/authenticated to be safe.
REVOKE EXECUTE ON FUNCTION public.increment_rate_limit FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_rate_limit FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_rate_limit FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit TO service_role;
