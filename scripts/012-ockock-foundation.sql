-- OckOck Foundation Tables
-- Fighter registry, events, and bouts for the fight platform
-- These tables are owned by the OckOck product but live in the shared Nomadex database
-- Connected to shared tables: users, organizations

-- ============================================
-- 1. FIGHTERS (Standalone Fighter Registry)
-- ============================================
-- A fighter is NOT the same as a trainer_profile.
-- A trainer teaches at a gym. A fighter competes.
-- A user can be both (linked via user_id).

CREATE TABLE IF NOT EXISTS fighters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Identity
  ring_name TEXT,
  weight_class TEXT,
  stance TEXT CHECK (stance IN ('orthodox', 'southpaw', 'switch')),

  -- Fight record
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  no_contests INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'retired', 'suspended')),
  open_to_fights BOOLEAN DEFAULT FALSE,
  open_to_events BOOLEAN DEFAULT FALSE,

  -- Profile
  bio TEXT,
  photo_url TEXT,
  photos TEXT[] DEFAULT '{}',

  -- Cross-product links
  trainer_profile_id UUID REFERENCES trainer_profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_fighters_user ON fighters(user_id);
CREATE INDEX IF NOT EXISTS idx_fighters_gym ON fighters(gym_id);
CREATE INDEX IF NOT EXISTS idx_fighters_status ON fighters(status);
CREATE INDEX IF NOT EXISTS idx_fighters_open ON fighters(open_to_fights) WHERE open_to_fights = TRUE;

-- ============================================
-- 2. EVENTS (Fight Nights, Tournaments, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Event details
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  event_type TEXT DEFAULT 'fight_night' CHECK (event_type IN ('fight_night', 'tournament', 'exhibition', 'training_camp')),

  -- When & where
  event_date DATE NOT NULL,
  start_time TIME,
  venue_name TEXT,
  venue_address TEXT,
  venue_city TEXT,
  venue_country TEXT DEFAULT 'Thailand',

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'announced', 'ticket_sales', 'sold_out', 'live', 'completed', 'cancelled')),

  -- Capacity & pricing
  max_capacity INTEGER,
  ticket_price_thb INTEGER,
  ticket_price_usd INTEGER,

  -- Media
  poster_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_org ON events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- ============================================
-- 3. EVENT BOUTS (Individual Fights in an Event)
-- ============================================

CREATE TABLE IF NOT EXISTS event_bouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Fighters (red corner / blue corner)
  fighter_red_id UUID REFERENCES fighters(id) ON DELETE SET NULL,
  fighter_blue_id UUID REFERENCES fighters(id) ON DELETE SET NULL,

  -- Bout details
  weight_class TEXT,
  rounds INTEGER DEFAULT 5,
  bout_order INTEGER DEFAULT 0,
  is_main_event BOOLEAN DEFAULT FALSE,

  -- Result
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'live', 'completed', 'cancelled', 'no_contest')),
  winner_id UUID REFERENCES fighters(id),
  method TEXT CHECK (method IN ('KO', 'TKO', 'decision', 'unanimous_decision', 'split_decision', 'submission', 'DQ', 'draw', 'no_contest')),
  round_ended INTEGER,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_bouts_event ON event_bouts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bouts_fighter_red ON event_bouts(fighter_red_id);
CREATE INDEX IF NOT EXISTS idx_event_bouts_fighter_blue ON event_bouts(fighter_blue_id);

-- ============================================
-- 4. EXTEND ORG_MEMBERS ROLES
-- ============================================
-- Add 'promoter' and 'fighter' roles to support OckOck users

ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_role_check;
ALTER TABLE org_members ADD CONSTRAINT org_members_role_check
  CHECK (role IN ('owner', 'admin', 'trainer', 'student', 'promoter', 'fighter'));

-- ============================================
-- 5. ENABLE RLS
-- ============================================

ALTER TABLE fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bouts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES — FIGHTERS
-- ============================================

-- Public can view active fighters
CREATE POLICY "Public can view active fighters"
  ON fighters FOR SELECT
  USING (status = 'active');

-- Fighters can update their own profile
CREATE POLICY "Fighters can update own profile"
  ON fighters FOR UPDATE
  USING (user_id = auth.uid());

-- Gym admins can manage fighters from their gym
CREATE POLICY "Gym admins can manage gym fighters"
  ON fighters FOR ALL
  USING (
    gym_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Platform admins full access
CREATE POLICY "Platform admins full access to fighters"
  ON fighters FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE)
  );

-- Users can insert their own fighter profile
CREATE POLICY "Users can create own fighter profile"
  ON fighters FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 7. RLS POLICIES — EVENTS
-- ============================================

-- Public can view non-draft events
CREATE POLICY "Public can view announced events"
  ON events FOR SELECT
  USING (status != 'draft');

-- Org members (promoters) can manage their events
CREATE POLICY "Org staff can manage events"
  ON events FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'promoter')
    )
  );

-- Platform admins full access
CREATE POLICY "Platform admins full access to events"
  ON events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE)
  );

-- ============================================
-- 8. RLS POLICIES — EVENT BOUTS
-- ============================================

-- Public can view bouts for visible events
CREATE POLICY "Public can view bouts"
  ON event_bouts FOR SELECT
  USING (
    event_id IN (SELECT id FROM events WHERE status != 'draft')
  );

-- Event organizers can manage bouts
CREATE POLICY "Event organizers can manage bouts"
  ON event_bouts FOR ALL
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'promoter')
    )
  );

-- Platform admins full access
CREATE POLICY "Platform admins full access to bouts"
  ON event_bouts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE)
  );

-- ============================================
-- 9. UPDATE TRIGGERS
-- ============================================

CREATE TRIGGER update_fighters_updated_at
  BEFORE UPDATE ON fighters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_bouts_updated_at
  BEFORE UPDATE ON event_bouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
