-- ============================================================
-- RUN-MISSING-MIGRATIONS.sql
-- ------------------------------------------------------------
-- Applies the migrations that were never run on this database.
-- Verified missing against the live schema on 2026-06-08.
--
-- Fully idempotent — safe to run once or many times. Re-running
-- does nothing extra (IF NOT EXISTS / DROP ... IF EXISTS guards).
--
-- Run it in: Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- Covers:
--   037  lessons.hero_image_url / gallery + course media buckets
--   041  support_tickets table        (Help / support tickets)
--   043  platform_signals table       (operator "Today's Signals")
--   044  course_modules.summary cols   (AI module summaries)
--   045  email_send_log + org_settings email toggles (sequences cron)
--   048  users.verified_examiner_by / verified_examiner_note
--   052  rate_limit_buckets table     (lib/rate-limit.ts)
-- ============================================================


-- ─── 037: lesson media columns ──────────────────────────────
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 037: course media storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-media','course-media',TRUE,5242880,
     ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('course-videos','course-videos',TRUE,524288000,
     ARRAY['video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "course media public read" ON storage.objects;
CREATE POLICY "course media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('course-media','course-videos'));

DROP POLICY IF EXISTS "course media authorized upload" ON storage.objects;
CREATE POLICY "course media authorized upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('course-media','course-videos')
    AND (
      ((storage.foldername(name))[1] = 'platform' AND is_platform_admin())
      OR (
        (storage.foldername(name))[1] = 'org'
        AND has_org_role(((storage.foldername(name))[2])::uuid, ARRAY['owner','admin'])
      )
    )
  );

DROP POLICY IF EXISTS "course media authorized delete" ON storage.objects;
CREATE POLICY "course media authorized delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('course-media','course-videos')
    AND (
      ((storage.foldername(name))[1] = 'platform' AND is_platform_admin())
      OR (
        (storage.foldername(name))[1] = 'org'
        AND has_org_role(((storage.foldername(name))[2])::uuid, ARRAY['owner','admin'])
      )
    )
  );


-- ─── 041: support_tickets ───────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES mtp_conversations(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  initial_body TEXT NOT NULL,
  source_url TEXT,
  category TEXT CHECK (category IN ('billing','setup','feature','bug','urgent','other')) DEFAULT 'other',
  priority TEXT CHECK (priority IN ('low','normal','high','urgent')) DEFAULT 'normal',
  ai_summary TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','waiting_customer','resolved','closed')),
  sla_due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS support_tickets_status_sla_idx
  ON support_tickets (status, sla_due_at)
  WHERE status IN ('open','in_progress','waiting_customer');
CREATE INDEX IF NOT EXISTS support_tickets_org_idx
  ON support_tickets (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_priority_idx
  ON support_tickets (priority, status)
  WHERE priority IN ('urgent','high');
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org admins create + read their tickets" ON support_tickets;
CREATE POLICY "Org admins create + read their tickets"
  ON support_tickets FOR ALL
  USING (has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']));
DROP POLICY IF EXISTS "Platform admins full access tickets" ON support_tickets;
CREATE POLICY "Platform admins full access tickets"
  ON support_tickets FOR ALL
  USING (is_platform_admin());
DROP TRIGGER IF EXISTS support_tickets_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─── 043: platform_signals ──────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info','warning','critical')),
  target_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT,
  evidence JSONB DEFAULT '{}'::jsonb,
  suggested_action TEXT,
  action_payload JSONB,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','dismissed','acted_on','stale')),
  dedup_key TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
  ON platform_signals (severity, generated_at DESC) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS platform_signals_target_idx
  ON platform_signals (target_org_id, status, generated_at DESC) WHERE target_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS platform_signals_kind_idx
  ON platform_signals (kind, status);
ALTER TABLE platform_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage signals" ON platform_signals;
CREATE POLICY "Platform admins manage signals"
  ON platform_signals FOR ALL
  USING (is_platform_admin()) WITH CHECK (is_platform_admin());
DROP TRIGGER IF EXISTS platform_signals_updated_at ON platform_signals;
CREATE TRIGGER platform_signals_updated_at
  BEFORE UPDATE ON platform_signals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─── 044: course_modules AI summaries ───────────────────────
ALTER TABLE course_modules
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMPTZ;


-- ─── 045: email_send_log + org_settings sequence toggles ────
CREATE TABLE IF NOT EXISTS email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  sequence TEXT NOT NULL,
  trigger_ref TEXT NOT NULL,
  resend_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','failed','skipped','bounced')),
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (recipient_user_id, sequence, trigger_ref)
);
CREATE INDEX IF NOT EXISTS email_send_log_org_recent_idx
  ON email_send_log (org_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS email_send_log_sequence_idx
  ON email_send_log (sequence, sent_at DESC);
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins read all email log" ON email_send_log;
CREATE POLICY "Platform admins read all email log"
  ON email_send_log FOR SELECT USING (is_platform_admin());
DROP POLICY IF EXISTS "Org admins read their gym's email log" ON email_send_log;
CREATE POLICY "Org admins read their gym's email log"
  ON email_send_log FOR SELECT USING (has_org_role(org_id, ARRAY['owner','admin']));

ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS email_welcome_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_lapsed_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_cert_congrats_enabled BOOLEAN NOT NULL DEFAULT TRUE;


-- ─── 048: verified-examiner columns (the names the code uses) ─
-- NB: the DB already has an orphan `verified_examiner_by_user_id` from a
-- divergent migration (064); no code references it, so we leave it alone
-- and add the two columns the app actually reads/writes.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verified_examiner_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_examiner_note TEXT;
CREATE INDEX IF NOT EXISTS users_verified_examiner_idx
  ON users (is_verified_examiner) WHERE is_verified_examiner = TRUE;


-- ─── 052: rate_limit_buckets ────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_expires
  ON rate_limit_buckets (expires_at);
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
