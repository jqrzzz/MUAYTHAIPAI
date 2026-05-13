-- 055-platform-partner-role.sql
--
-- A second tier of platform access: "partner".
--
-- Until now, platform access has been a single boolean (users.is_platform_admin).
-- A "partner" is a platform admin with the money/billing surfaces hidden —
-- they see the whole operator console (network, gyms, students, trainers,
-- curriculum, support, audit, ...) but not Payouts, Subscriptions/MRR, the
-- bookings-revenue breakdown, or the gym subscription on/off toggle.
--
-- Mechanism: a partner still has is_platform_admin = TRUE (so every existing
-- access check just works); the new platform_admin_role column controls which
-- *version* of the console they get.
--
-- The invites table also gets a platform_admin_role column so a platform-level
-- invite can carry the intended tier (NULL = an ordinary, gym-scoped invite).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS platform_admin_role TEXT NOT NULL DEFAULT 'full'
  CHECK (platform_admin_role IN ('full', 'partner'));

COMMENT ON COLUMN users.platform_admin_role IS
  'Only meaningful when is_platform_admin = TRUE. ''full'' = sees everything; ''partner'' = money/billing surfaces hidden.';

ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS platform_admin_role TEXT
  CHECK (platform_admin_role IS NULL OR platform_admin_role IN ('full', 'partner'));

COMMENT ON COLUMN invites.platform_admin_role IS
  'NULL = an ordinary gym-scoped invite (org_id + role apply). Otherwise this invite, when accepted, grants platform access at the given tier.';
