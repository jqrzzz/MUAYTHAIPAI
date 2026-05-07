-- Role-model cleanup
-- Version: 1.0.0  (Wave 10: clarify the four-tier role model)
--
-- After Phase G we sat down and audited the role model. Two pieces of
-- the schema were dead weight:
--
-- 1. org_members.role allowed 'student' as a value, but in practice
--    students don't get an org_members row — they're signed-in users
--    who book at gyms. Their relationship to a gym lives in `bookings`,
--    not membership. Keeping 'student' in the enum confused the model.
--
-- 2. The four can_manage_* boolean columns on org_members were SET on
--    invite acceptance but never READ for permission decisions —
--    every gate in the codebase just checks role IN ('owner','admin')
--    or includes 'trainer'. The columns were noise.
--
-- This migration removes both, locking the role enum down to what the
-- code actually uses: owner, admin, trainer.
--
-- Safety:
--   - The migration UPDATEs any existing role='student' rows to a
--     no-op role first (we just delete them — students belong in
--     bookings, not org_members). If there are any, ops will see the
--     count in the NOTICE.
--   - DROP COLUMN is destructive but the columns were unread.
-- ============================================

DO $$
DECLARE
  legacy_student_count INT;
BEGIN
  SELECT COUNT(*) INTO legacy_student_count
  FROM org_members
  WHERE role = 'student';

  IF legacy_student_count > 0 THEN
    RAISE NOTICE 'Removing % legacy student-role org_members rows', legacy_student_count;
    DELETE FROM org_members WHERE role = 'student';
  END IF;
END $$;

-- 1. Tighten the role enum to remove 'student'.
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_role_check;
ALTER TABLE org_members ADD CONSTRAINT org_members_role_check
  CHECK (role IN ('owner', 'admin', 'trainer'));

-- 2. Drop the unread permission columns. If we ever need fine-grained
--    per-staff perms (e.g. a front-desk role that can manage bookings
--    but not services), we'll add them back at that time with a clear
--    spec for what reads them.
ALTER TABLE org_members DROP COLUMN IF EXISTS can_manage_bookings;
ALTER TABLE org_members DROP COLUMN IF EXISTS can_manage_services;
ALTER TABLE org_members DROP COLUMN IF EXISTS can_manage_members;
ALTER TABLE org_members DROP COLUMN IF EXISTS can_view_payments;

COMMENT ON COLUMN org_members.role IS
  'owner | admin | trainer. Students do NOT have org_members rows — their gym relationships live in bookings. Platform admins are tracked separately on users.is_platform_admin.';
