-- ============================================================================
-- MUAYTHAIPAI / OckOck — pending DB migrations, combined for manual application
-- Generated 2026-06-10. Run order = top to bottom (000 -> 005).
--
-- WHAT THIS IS
--   The six tracked migrations in supabase/migrations/ that have NOT yet been
--   applied to the production database (the Supabase CLI migration history is
--   empty; everything live was built by hand from scripts/). Bundled here so
--   you can paste the whole file into the Supabase SQL editor (or psql) and
--   run it once.
--
-- SAFE TO RUN
--   Every statement is idempotent (IF EXISTS / IF NOT EXISTS / DROP-then-CREATE
--   / guarded constraint). Re-running is a no-op. There is NO CREATE INDEX
--   CONCURRENTLY, so the whole script is safe inside a single transaction.
--   Verified live 2026-06-10: all 9 function signatures, the 4 policy names,
--   and every table/column referenced below exist exactly as written.
--
-- WHAT EACH PART DOES
--   000  baseline marker (no DDL)
--   001  SECURITY: drop 4 anon-writable "WITH CHECK (true)" INSERT policies
--        (gym_notifications, student_subscriptions, activity_logs,
--        ticket_interest) + pin search_path=public on 9 repo-owned functions
--   002  bookings.service_id -> nullable (cert-enrollment + Stripe webhook
--        fallback both insert bookings with no service)
--   003  create gym_ai_persona (+ RLS) — unblocks the Train-OckOck voice editor
--        and the concierge's per-gym voice
--   004  social_posts v2 columns (+ relax legacy NOT NULLs, source check, 2 idx)
--        — unblocks all social write paths + operator adoption metrics
--   005  index 28 unindexed foreign keys on the core transactional tables
--
-- MIGRATION HISTORY NOTE
--   Running this by hand does NOT record these versions in
--   supabase_migrations.schema_migrations. Because every statement is
--   idempotent that's harmless — a later `supabase db push` re-runs them with
--   no effect. To keep a clean CLI history instead, after running mark them:
--     supabase migration repair --status applied \
--       20260610000000 20260610000001 20260610000002 \
--       20260610000003 20260610000004 20260610000005
-- ============================================================================



-- ===========================================================================
-- 20260610000000_baseline_existing_schema.sql
-- ===========================================================================
-- Baseline marker for the MUAYTHAIPAI/OckOck schema.
--
-- Everything that exists in the database as of 2026-06-10 was built from the
-- frozen SQL history in scripts/ (000..070), applied by hand via the dashboard
-- SQL editor. Verified live on 2026-06-10: supabase_migrations history is
-- EMPTY, so this no-op migration marks the start of tracked history. Every
-- schema change after this version must ship as a migration in this directory
-- (see docs/MIGRATIONS.md).
--
-- Intentionally contains no DDL.
select 1;


-- ===========================================================================
-- 20260610000001_harden_rls_and_function_paths.sql
-- ===========================================================================
-- Hardening pass driven by the live Supabase security advisors (2026-06-10).
--
-- PART 1 — drop four "always true" INSERT policies.
--
-- Each was named as if it scoped the service role, but was actually created
-- for roles={public}/{anon,authenticated} with WITH CHECK (true) — i.e. it
-- let ANY anonymous REST client insert rows directly, bypassing the API
-- routes' rate limits and validation. The service role does not need a
-- policy at all (it bypasses RLS), and every legitimate writer of these
-- tables was verified to use the service client:
--   gym_notifications     → lib/notifications.ts (service)         [spam into a gym's admin inbox]
--   student_subscriptions → no app writer at all                   [forge a subscription for any user]
--   activity_logs         → no app writer at all                   [forge audit rows]
--   ticket_interest       → public notify route (service client,   [skip its rate limit + honeypot]
--                           rate-limited, honeypot, email-validated)
-- The remaining scoped SELECT/UPDATE/DELETE policies on these tables are
-- untouched, so admin/student/promoter reads keep working.

drop policy if exists "Service role can insert notifications" on public.gym_notifications;
drop policy if exists "Service role inserts student subscriptions" on public.student_subscriptions;
drop policy if exists "Insert activity logs" on public.activity_logs;
drop policy if exists "ticket_interest_public_insert" on public.ticket_interest;

-- PART 2 — pin search_path on the functions this repo owns.
--
-- Advisor: function_search_path_mutable. A role-mutable search_path lets a
-- caller's session influence name resolution inside SECURITY DEFINER
-- functions (classic privilege-escalation vector). Pinning to `public`
-- preserves today's exact resolution while closing the vector. Only the
-- functions created by this repo's scripts/ are touched — the database is
-- shared with other apps whose functions are theirs to fix.

alter function public.is_org_member(uuid) set search_path = public;
alter function public.has_org_role(uuid, text[]) set search_path = public;
alter function public.is_platform_admin() set search_path = public;
alter function public.handle_new_user() set search_path = public;
alter function public.update_updated_at_column() set search_path = public;
alter function public.update_course_updated_at() set search_path = public;
alter function public.bout_invitations_set_updated_at() set search_path = public;
alter function public.set_skill_submissions_updated_at() set search_path = public;
alter function public.ticket_interest_set_email_lower() set search_path = public;


-- ===========================================================================
-- 20260610000002_bookings_service_id_nullable.sql
-- ===========================================================================
-- bookings.service_id → nullable.
--
-- Found by adopting generated DB types (2026-06-10): the column is NOT NULL
-- in prod, but two code paths legitimately create bookings without a service:
--   - the cert-enrollment flow (app/api/public/enroll/*) — a cert level is
--     not a `services` row; its booking carries the THB amount only;
--   - the Stripe webhook's documented fallback ("always still want to save
--     the booking") which passes service_id NULL when the by-name lookup
--     misses.
-- Both inserts would violate the constraint and fail silently today
-- (verified live: 0 cert enrollments have ever been created, so it has not
-- fired yet — the first real one would lose its payment record).
--
-- Reading code already tolerates a null FK (nested `services(name)` selects
-- and `service?.id || null` writes), so dropping NOT NULL is the schema
-- catching up with the code's intent.

alter table public.bookings alter column service_id drop not null;


-- ===========================================================================
-- 20260610000003_gym_ai_persona.sql
-- ===========================================================================
-- Port of scripts/078-gym-ai-persona.sql, which was never applied to prod
-- (verified live 2026-06-10: the table does not exist, so the Train-OckOck
-- persona editor and the concierge's per-gym voice have been silently
-- broken — every save 404s and the concierge always uses the default voice).
-- Content identical to the script; idempotent.
CREATE TABLE IF NOT EXISTS gym_ai_persona (
  org_id        UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  voice         TEXT,                       -- how OckOck should sound for this gym
  greeting      TEXT,                       -- optional custom opening line
  language_mode TEXT NOT NULL DEFAULT 'thai_first'
                CHECK (language_mode IN ('thai_first', 'english_first', 'mirror')),
  guidelines    TEXT,                       -- always-do / never-do house rules
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gym_ai_persona ENABLE ROW LEVEL SECURITY;

-- Members of the gym can read their own persona (for the editor).
DROP POLICY IF EXISTS "gym_ai_persona_select" ON gym_ai_persona;
CREATE POLICY "gym_ai_persona_select" ON gym_ai_persona
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Owners + admins can create / update it.
DROP POLICY IF EXISTS "gym_ai_persona_write" ON gym_ai_persona;
CREATE POLICY "gym_ai_persona_write" ON gym_ai_persona
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );


-- ===========================================================================
-- 20260610000004_social_posts_v2_columns.sql
-- ===========================================================================
-- social_posts v2 columns — the missing half of scripts/035-add-social-posts.sql.
--
-- Prod already had an older social_posts table (caption/content_type per-post),
-- so 035's CREATE TABLE IF NOT EXISTS silently no-op'd. The code, however, was
-- written against 035's v2 shape: multi-platform posts with per-platform
-- content JSONB and AI provenance. Verified live 2026-06-10: platforms /
-- content / source / source_intent / published_at do not exist, so every
-- social write path (manual save, AI compose, AI weekly batch) and the
-- operator adoption metrics have been silently broken.
--
-- This adds the v2 columns alongside the legacy ones (caption, content_type,
-- ai_generated, …) — nothing reads the legacy columns in current code, but
-- they may hold old data, so they are left untouched.

alter table public.social_posts add column if not exists platforms text[] not null default '{}'::text[];
alter table public.social_posts add column if not exists content jsonb not null default '{}'::jsonb;
alter table public.social_posts add column if not exists source text not null default 'manual';
alter table public.social_posts add column if not exists source_intent text;
alter table public.social_posts add column if not exists published_at timestamptz;

-- The legacy table had caption + content_type as NOT NULL (no default). The
-- v2 writers store everything in the content JSONB and never set these, so
-- every v2 insert would violate the constraint. Relax them — they remain for
-- any legacy rows but are no longer required.
alter table public.social_posts alter column caption drop not null;
alter table public.social_posts alter column content_type drop not null;

-- Source is constrained as in 035 (manual | ai_compose | ai_batch).
do $$ begin
  alter table public.social_posts
    add constraint social_posts_source_check
    check (source in ('manual','ai_compose','ai_batch'));
exception when duplicate_object then null;
end $$;

create index if not exists social_posts_org_id_status_idx
  on public.social_posts (org_id, status, scheduled_for);
create index if not exists social_posts_org_id_created_at_idx
  on public.social_posts (org_id, created_at desc);


-- ===========================================================================
-- 20260610000005_index_core_foreign_keys.sql
-- ===========================================================================
-- Index foreign keys on the core transactional tables.
--
-- From the live performance advisors (2026-06-10): these FK columns had no
-- covering index. Two costs of that, both of which bite as the network grows:
--   1. Cascade deletes / FK checks do a sequential scan of the child table.
--      Deleting an org cascades into bookings, certificates, skill_signoffs,
--      etc. — each unindexed FK turns that into a full scan.
--   2. Joins and "find by parent" lookups (the app does many: a trainer's
--      payouts, a booking's transactions, a conversation's ticket) scan
--      instead of seeking.
--
-- Scope: only the core, growth-bound tables (transactions, certs, payouts,
-- bookings, support). The advisor flagged ~135 unindexed FKs across the whole
-- (multi-app) database; the rest are on empty/peripheral tables where the
-- write-cost of an index isn't yet justified — deferred to docs/PERFORMANCE.md.
--
-- All idempotent. Plain CREATE INDEX (not CONCURRENTLY) is fine at current
-- table sizes; if any of these grows to millions of rows before this runs,
-- switch that one to CONCURRENTLY (outside a txn).

-- bookings
create index if not exists idx_bookings_trainer_id on public.bookings (trainer_id);
create index if not exists idx_bookings_payment_collected_by on public.bookings (payment_collected_by);

-- certificates & enrollments
create index if not exists idx_certificates_issued_by on public.certificates (issued_by);
create index if not exists idx_certification_enrollments_booking_id on public.certification_enrollments (booking_id);
create index if not exists idx_certification_enrollments_certificate_id on public.certification_enrollments (certificate_id);

-- skill sign-offs & submissions
create index if not exists idx_skill_signoffs_signed_off_by on public.skill_signoffs (signed_off_by);
create index if not exists idx_skill_submissions_reviewer_id on public.skill_submissions (reviewer_id);

-- credits & transactions
create index if not exists idx_credit_transactions_booking_id on public.credit_transactions (booking_id);
create index if not exists idx_credit_transactions_recorded_by on public.credit_transactions (recorded_by);
create index if not exists idx_credit_transactions_student_credit_id on public.credit_transactions (student_credit_id);

-- payouts & payments
create index if not exists idx_gym_payouts_paid_by on public.gym_payouts (paid_by);
create index if not exists idx_trainer_payouts_created_by on public.trainer_payouts (created_by);
create index if not exists idx_trainer_commission_rules_trainer_id on public.trainer_commission_rules (trainer_id);
create index if not exists idx_trainer_commission_rules_service_id on public.trainer_commission_rules (service_id);
create index if not exists idx_payments_user_id on public.payments (user_id);
create index if not exists idx_gym_subscription_invoices_gym_subscription_id on public.gym_subscription_invoices (gym_subscription_id);

-- courses
create index if not exists idx_lesson_progress_lesson_id on public.lesson_progress (lesson_id);

-- student notes
create index if not exists idx_student_notes_booking_id on public.student_notes (booking_id);
create index if not exists idx_student_notes_trainer_id on public.student_notes (trainer_id);

-- inbox / support
create index if not exists idx_mtp_conversations_assigned_to on public.mtp_conversations (assigned_to);
create index if not exists idx_mtp_conversations_group_id on public.mtp_conversations (group_id);
create index if not exists idx_support_tickets_conversation_id on public.support_tickets (conversation_id);
create index if not exists idx_support_tickets_resolved_by on public.support_tickets (resolved_by);
create index if not exists idx_support_tickets_user_id on public.support_tickets (user_id);

-- marketing / fights
create index if not exists idx_social_posts_created_by on public.social_posts (created_by);
create index if not exists idx_campaigns_created_by on public.campaigns (created_by);
create index if not exists idx_event_bouts_winner_id on public.event_bouts (winner_id);
create index if not exists idx_ticket_orders_scanned_by_user_id on public.ticket_orders (scanned_by_user_id);
