-- ============================================
-- 074: Tier 0 safety pass — three live bugs sitting in prod
--
-- These are sitting in the live DB right now. None of them require code
-- changes; this migration alone closes the three biggest tenant-safety
-- gaps surfaced by the multi-tenant readiness audit
-- (docs/ockock-multi-tenant-readiness.md).
--
-- 1) `social_posts` has an open-door RLS policy ("Authenticated users
--    can manage social posts") with qual=true, with_check=true, cmd=ALL.
--    Any logged-in user from any gym can read AND modify any other gym's
--    social posts. Postgres OR-merges policies, so the four properly
--    org-scoped policies on the same table are bypassed by this one.
--
-- 2) `make_wisarut_owner` is a trigger on public.users that auto-
--    promotes a brand-new user to MTP owner if the owners table is
--    empty. A no-op today (an owner exists), but it's a latent footgun:
--    the moment that row is ever cleared (restore, re-key, data wipe),
--    the very next signup from ANY gym silently becomes owner of MTP.
--
-- 3) `bookings` and `payments` had anon INSERT policies with
--    `WITH CHECK true`. A hostile anon caller hitting the Supabase
--    REST endpoint directly can write a row with any org_id (or NULL).
--    Tighten to require a non-null org_id that references an active
--    organization. The service-role API paths (/api/public/enroll, etc.)
--    bypass RLS and are unaffected.
--
-- Nothing destructive — the dropped policy/trigger/function are
-- restorable from `scripts/050-security-hygiene.sql` and the original
-- `001-create-tables.sql` if needed.
-- ============================================

-- ── 1. Drop the wide-open social_posts policy ──────────────────────
-- The four other policies on this table (org-scoped, platform-admin
-- override, service-role bypass) remain in place — they were already
-- doing the right thing; this one was overriding them with OR=true.
DROP POLICY IF EXISTS "Authenticated users can manage social posts" ON social_posts;

-- ── 2. Drop the make_wisarut_owner trigger + function ──────────────
-- New gym signups create their owner via the proper invite-accept flow
-- (app/api/invites/[token]/accept/route.ts). This legacy trigger was a
-- one-shot seeder for the original MTP owner and shouldn't live in a
-- multi-tenant DB.
DROP TRIGGER IF EXISTS on_user_created_make_owner ON public.users;
DROP FUNCTION IF EXISTS public.make_wisarut_owner();

-- ── 3. Tighten anon INSERT on bookings + payments ──────────────────
-- Require a non-null org_id pointing at an active organization.
-- An anon caller spamming with NULL org_id or a random UUID is blocked
-- at the policy layer; FK constraints catch random UUIDs at the DB
-- layer too, but the WITH CHECK gives a defence-in-depth + reduces
-- noisy 23503 errors in logs.

DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (
    org_id IS NOT NULL
    AND org_id IN (SELECT id FROM organizations WHERE status = 'active')
  );

DROP POLICY IF EXISTS "Insert payments" ON payments;
CREATE POLICY "Insert payments"
  ON payments FOR INSERT
  TO public
  WITH CHECK (
    org_id IS NOT NULL
    AND org_id IN (SELECT id FROM organizations WHERE status = 'active')
  );
