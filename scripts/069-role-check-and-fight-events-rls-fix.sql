-- =====================================================
-- 069-role-check-and-fight-events-rls-fix
-- =====================================================
-- Three fixes in one migration. All are audit catches that
-- ranged from "footgun waiting to detonate" to "actively
-- broken RLS":
--
-- (1) WIDEN org_members.role CHECK CONSTRAINT
--
--     Live CHECK only allowed ('owner', 'admin', 'trainer').
--     But:
--       - lib/auth-helpers.ts:128-141 (getPromoterAuth) queries
--         role IN ('owner', 'admin', 'promoter')
--       - lib/auth-helpers.ts:225 (getCourseAuthorAccess) queries
--         role IN ('owner', 'admin', 'trainer', 'student')
--       - Every recent RLS policy on event_*, ticket_*,
--         matchmaker_*, pricing_*, marketing_* references
--         'promoter' in the role array.
--
--     Result: a row with role='promoter' could never be inserted,
--     so every reference to 'promoter' in the policy layer was
--     dead code. Live data was unaffected (everyone is 'owner'
--     today) but the moment we onboard a non-owner 'promoter'
--     account, all the gated endpoints would silently 401 them.
--
--     Migration 012 was supposed to widen this but the live
--     constraint never got the update. We catch it explicitly.
--
-- (2) TIGHTEN fight_events RLS to require status='active'
--
--     "Org staff can manage events" was:
--       USING (org_id IN (SELECT om.org_id FROM org_members om
--              WHERE om.user_id = auth.uid()
--                AND om.role = ANY(...)))
--     — note: no status check. A suspended or pending org_member
--     retained full read/write of every event in the org. Every
--     other RLS policy in the fight-events subsystem checks
--     status='active'; this one was the outlier.
--
-- (3) ON DELETE for bout_invitations.fighter_id: CASCADE → SET NULL
--
--     A fighter offboarding (trainer_profiles row deleted) was
--     blowing away their full invitation history. We want that
--     history preserved for analytics + audit; consistent with
--     event_bouts.fighter_red_id / fighter_blue_id / winner_id
--     which are all SET NULL on fighter delete.

-- ============================================
-- (1) Widen org_members.role CHECK
-- ============================================
ALTER TABLE public.org_members
  DROP CONSTRAINT IF EXISTS org_members_role_check;

ALTER TABLE public.org_members
  ADD CONSTRAINT org_members_role_check
  CHECK (role IN ('owner', 'admin', 'trainer', 'student', 'promoter'));

-- ============================================
-- (2) fight_events RLS — add active-status gate
-- ============================================
DROP POLICY IF EXISTS "Org staff can manage events" ON public.fight_events;
CREATE POLICY "Org staff can manage events" ON public.fight_events
  FOR ALL
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );

-- ============================================
-- (3) bout_invitations.fighter_id ON DELETE CASCADE → SET NULL
-- ============================================
-- Drop the existing FK, recreate with SET NULL. Safe because
-- ticker_orders / event_bouts already use the same pattern.
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'public.bout_invitations'::regclass
    AND contype = 'f'
    AND conkey = (
      SELECT array_agg(attnum ORDER BY attnum)
      FROM pg_attribute
      WHERE attrelid = 'public.bout_invitations'::regclass
        AND attname = 'fighter_id'
    );
  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bout_invitations DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

-- We need the column to allow NULLs for SET NULL to work. The
-- original migration declared NOT NULL on fighter_id; relax it.
ALTER TABLE public.bout_invitations
  ALTER COLUMN fighter_id DROP NOT NULL;

ALTER TABLE public.bout_invitations
  ADD CONSTRAINT bout_invitations_fighter_id_fkey
  FOREIGN KEY (fighter_id)
  REFERENCES public.trainer_profiles(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.bout_invitations.fighter_id IS
  'Fighter being invited. NULL after fighter offboards (trainer_profiles row deleted) — row retained for invitation-history analytics.';
