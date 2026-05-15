-- =====================================================
-- 059-bout-invitations
-- =====================================================
-- The fighter consent layer. Before this migration, a promoter could
-- assign any opted-in fighter directly to a bout via the bout editor,
-- with no notification or chance for the fighter to decline. That's
-- awkward across gyms — a promoter at a different gym shouldn't be
-- able to book someone without their say-so.
--
-- This table is the L4 connective tissue: promoter sends an invite,
-- fighter sees it in their inbox, accepts or declines. On accept the
-- existing event_bouts.fighter_{red,blue}_id is populated so the rest
-- of the system (public fight page, ticket sales, etc.) keeps working
-- unchanged.

CREATE TABLE IF NOT EXISTS bout_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which bout + corner this is for
  bout_id uuid NOT NULL REFERENCES event_bouts(id) ON DELETE CASCADE,
  corner text NOT NULL CHECK (corner IN ('red', 'blue')),

  -- Who's being invited (fighters live in trainer_profiles)
  fighter_id uuid NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,

  -- Who sent it (for audit + RLS)
  invited_by_user_id uuid NOT NULL REFERENCES users(id),
  invited_by_org_id  uuid NOT NULL REFERENCES organizations(id),

  -- Lifecycle. "cancelled" = promoter withdrew. "declined" = fighter said no.
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),

  -- Optional message from the promoter to the fighter
  message text,

  -- Set when status transitions out of pending
  responded_at timestamptz,
  decline_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one pending invitation per (bout, corner) at a time. Once it's
-- declined / cancelled, the promoter can invite someone else.
CREATE UNIQUE INDEX IF NOT EXISTS bout_invitations_active_corner_unique
  ON bout_invitations (bout_id, corner)
  WHERE status = 'pending';

-- Fighter inbox lookup (their pending invites)
CREATE INDEX IF NOT EXISTS bout_invitations_fighter_status_idx
  ON bout_invitations (fighter_id, status);

-- Promoter view (all invites for a bout)
CREATE INDEX IF NOT EXISTS bout_invitations_bout_idx
  ON bout_invitations (bout_id);

-- Auto-update updated_at on UPDATE. Inline the trigger so we don't
-- depend on a shared helper function existing already.
CREATE OR REPLACE FUNCTION bout_invitations_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bout_invitations_updated_at ON bout_invitations;
CREATE TRIGGER bout_invitations_updated_at
  BEFORE UPDATE ON bout_invitations
  FOR EACH ROW
  EXECUTE FUNCTION bout_invitations_set_updated_at();

-- RLS
ALTER TABLE bout_invitations ENABLE ROW LEVEL SECURITY;

-- Promoter side: members of the inviting org can read the invites
-- they sent (regardless of status), insert new ones if they're owner
-- or admin, and update (cancel) existing ones.
DROP POLICY IF EXISTS bout_invitations_promoter_select ON bout_invitations;
CREATE POLICY bout_invitations_promoter_select ON bout_invitations
  FOR SELECT
  USING (
    invited_by_org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS bout_invitations_promoter_insert ON bout_invitations;
CREATE POLICY bout_invitations_promoter_insert ON bout_invitations
  FOR INSERT
  WITH CHECK (
    invited_by_user_id = auth.uid()
    AND invited_by_org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS bout_invitations_promoter_update ON bout_invitations;
CREATE POLICY bout_invitations_promoter_update ON bout_invitations
  FOR UPDATE
  USING (
    invited_by_org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Fighter side: the fighter (via their trainer_profile.user_id) can
-- read invites sent to them and update (accept/decline) them.
DROP POLICY IF EXISTS bout_invitations_fighter_select ON bout_invitations;
CREATE POLICY bout_invitations_fighter_select ON bout_invitations
  FOR SELECT
  USING (
    fighter_id IN (
      SELECT id FROM trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS bout_invitations_fighter_update ON bout_invitations;
CREATE POLICY bout_invitations_fighter_update ON bout_invitations
  FOR UPDATE
  USING (
    fighter_id IN (
      SELECT id FROM trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE bout_invitations IS
  'Promoter → fighter consent layer for bout assignments. Accepting an invite populates event_bouts.fighter_{red,blue}_id; declining does not.';
